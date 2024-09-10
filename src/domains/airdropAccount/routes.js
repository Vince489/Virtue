const express = require("express");
const router = express.Router();
const Keypair = require("../../utils/keypair");
const AirdropAccount = require("./model");
const VRT = require("../vrt/model");
const VRTAccount = require("../vrtAccount/model");
const Account = require("../account/model");
const Gamer = require("../gamer/model");
const PendingTransaction = require("../pendingTransactions/model");
const Transaction = require("../transaction/model");
const Block = require("../block/model");
const Validator = require("../validator/model");
const GlobalState = require("../globalState/model");
const crypto = require('crypto');


// Convert Tokens to zennies 1 token = 100 zennies
const tokensToZennies = (tokens) => {
  return tokens * 100;
};

// Convert Zennies to Tokens 1 zenny = 0.01 tokens
const zenniesToTokens = (zennies) => {
  return zennies / 100;
};

// Create Airdrop Account
router.post('/', async (req, res, next) => {
  try {
    // Check if airdrop account already exists
    const airdropAccountAddress = 'AirDropZ2ed1VVvQvzyxpUkhkMghLf3BBBVtFVBpX6KY';
    // Check if the airdrop account already exists
    const existingAirdropAccount = await
    AirdropAccount.findOne({ address: airdropAccountAddress });

    if (existingAirdropAccount) {
      return res.status(409).json({
        message: "Airdrop account already exists.",
      });
    }

    // Generate a new key pair and seed phrase
    const keypair = Keypair.generate();

    // Create a new account associated with the seed phrase
    const newAirdropAccount = new AirdropAccount({
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    }); 

    // Save the new account to the database
    await newAirdropAccount.save();

    // Find the VRT coin account
    const mainCoin = await VRT.findOne({ symbol: 'VRT' });


    // Create a new vrtAccount associated with the gamer and VRT coin
    const newVRTAccount = new VRTAccount({
      owner:  newAirdropAccount._id, // Reference the gamer's account ID
      coin: mainCoin._id, // ID of the VRT coin
      publicKey: newAirdropAccount.publicKey, // Add this line
    });

    // Save the new vrtAccount to the database
    await newVRTAccount.save();

    // Associate the VRT account with the account using the middleware
    await associateVrtAccountAD(newAirdropAccount._id, newVRTAccount._id);

    // Respond with the newly created account data, the seed phrase, and the vrtAccount
    res.status(201).json({
      account: newAirdropAccount,
      vrtAccount: newVRTAccount,
    });
  } catch (error) {
    next(error);
  }
});

// Fund Airdrop Account
router.post('/fundAirdrop', async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Check if the required amount is provided and is a valid number
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing amount.' });
    }

    const mainAccountSymbol = 'VRT'; 

    // Find the main native token account
    const mainTokenAccount = await VRT.findOne({ symbol: mainAccountSymbol });

    if (!mainTokenAccount) {
      return res.status(404).json({ error: 'Main native token account not found.' });
    }

    // Convert the amount to zennies
    const zennies = tokensToZennies(amount);

    // Ensure there are sufficient funds in the main native token account
    if (mainTokenAccount.balance < zennies) {
      return res.status(400).json({ error: 'Insufficient balance in the main native token account.' });
    }

    // Deduct the amount from the main native token account in zennies
    mainTokenAccount.balance -= zennies;
    await mainTokenAccount.save();

    // Retrieve the airdrop account from the database
    const airdropAccount = await AirdropAccount.findOne({ address: 'AirDropZ2ed1VVvQvzyxpUkhkMghLf3BBBVtFVBpX6KY' });

    if (!airdropAccount) {
      return res.status(404).json({ error: 'Airdrop account not found.' });
    }

    // Update the balance of the airdrop account's VRT account
    const airdropVRTAccount = await VRTAccount.findById(airdropAccount.vrtAccount);

    if (!airdropVRTAccount) {
      return res.status(404).json({ error: "Airdrop's VRT account not found." });
    }

    airdropVRTAccount.balance += zennies;
    await airdropVRTAccount.save();

    // Respond with success message
    res.status(200).json({ message: 'Airdrop funding successful.' });
  } catch (error) {
    console.error('Error funding airdrop:', error.message);
    next(error);
  }
});

router.post("/airdrop", async (req, res) => {
  try {
    const amount = 100;
    const { publicKey } = req.body;

    //Find the airdrop account
    const airdropAccount = await AirdropAccount.findOne({ address: 'AirDropZ2ed1VVvQvzyxpUkhkMghLf3BBBVtFVBpX6KY' });

    if (!airdropAccount) {
      return res.status(404).json({ message: "Airdrop account not found" });
    }

    // Find the airdrop VRT account 
    const airdropVRTAccount = await VRTAccount.findOne({ owner: airdropAccount._id });

    if (!airdropVRTAccount || !airdropVRTAccount.balance) {
      return res.status(400).json({ message: "Airdrop VRT account or balance not available" });
    }

    const airdropBeginningBalance = airdropVRTAccount.balance;

    // Find the gamer account
    const gamerAccount = await Account.findOne({ publicKey });

    if (!gamerAccount) {
      return res.status(404).json({ message: "Gamer account not found" });
    }

    // Find the gamer VRT account
    const gamerVRTAccountId = gamerAccount.vrtAccount;
    const gamerVRTAccount = await VRTAccount.findById(gamerVRTAccountId);

    if (!gamerVRTAccount) {
      return res.status(404).json({ message: "Gamer VRT account not found" });
    }

    if (gamerVRTAccount.airdropReceived) {
      return res.status(400).json({ message: "Gamer has already received airdrop" });
    }

    if (airdropBeginningBalance < amount) {
      return res.status(400).json({ message: "Insufficient balance for airdrop" });
    }

    const zennies = amount * 100;
    const message = JSON.stringify({
      sender: airdropAccount.address,
      recipient: gamerAccount.publicKey,
      amount: zennies,
      type: 'airdrop',
      signStamp: Date.now()
    });

    const signature = Keypair.sign(message, airdropAccount.privateKey);

    // Create the pending transaction object
    const pendingTransaction = new PendingTransaction({
      sender: {
        id: airdropAccount._id,
        publicKey: airdropAccount.address,
        beginningBalance: airdropVRTAccount.balance,
        endingBalance: airdropVRTAccount.balance - zennies
      },
      recipient: {
        id: gamerAccount._id,
        publicKey: gamerAccount.publicKey,
        beginningBalance: gamerVRTAccount.balance,
        endingBalance: gamerVRTAccount.balance + zennies
      },
      type: 'airdrop',
      amount: zennies,
      signer: airdropAccount._id,
      signature: signature,
      confirmations: 0,
      fee: 0.00,
      complete: false // Ensure the field is set initially to false
    });

    // Save the pending transaction
    await pendingTransaction.save();

    const globalState = await GlobalState.findOne({ key: 'validatorIndex' });
    let currentIndex = globalState ? globalState.value : 0;

    const validators = await Validator.find({ active: true, stake: { $gt: 0 } }).sort({ index: 1 });

    const requiredConfirmations = 20;
    let confirmations = 0;
    let validatorsCount = 0;

    for (let i = 0; i < validators.length; i++) {
      const validator = validators[(currentIndex + i) % validators.length];
      const isValid = Keypair.verify(message, pendingTransaction.signature, airdropAccount.publicKey);
      validatorsCount++;
      if (isValid) {
        confirmations++;
      } else {
        console.error(`Invalid signature for validator: ${validator.address}`);
      }

      if (confirmations >= requiredConfirmations) {
        currentIndex = (currentIndex + i + 1) % validators.length;
        break;
      }
    }

    await GlobalState.updateOne(
      { key: 'validatorIndex' },
      { value: currentIndex },
      { upsert: true }
    );

    pendingTransaction.confirmations = confirmations;

    if (confirmations >= requiredConfirmations) {
      const newTransaction = new Transaction({
        sender: pendingTransaction.sender,
        recipient: pendingTransaction.recipient,
        type: pendingTransaction.type,
        amount: pendingTransaction.amount,
        signer: pendingTransaction.signer,
        signature: pendingTransaction.signature,
        confirmations: pendingTransaction.confirmations,
        fee: pendingTransaction.fee,
        complete: true // Ensure the field is set to true upon completion
      });

      airdropVRTAccount.balance -= zennies;
      gamerVRTAccount.balance += zennies;

      const nativeCoin = await VRT.findOne({ symbol: 'VRT' });
      nativeCoin.circulatingSupply += zennies;

      const blocks = await Block.find({});
      let latestBlock;

      if (blocks.length === 0) {
        const randomValidatorIndex = Math.floor(Math.random() * validators.length);
        const randomValidator = validators[randomValidatorIndex];
        const validatorAddress = randomValidator.address;
      
        // Create the genesis block
        latestBlock = new Block({
          slot: 0,
          previousHash: '0',
          validator: validatorAddress,
          reward: 0.00,
          transactions: []
        });
      
        latestBlock.hash = calculateBlockHash(latestBlock); // Calculate and set the hash
        await latestBlock.save();
      
        // Create the second block which will hold the first transaction
        const newBlock = new Block({
          slot: latestBlock.slot + 1,
          previousHash: latestBlock.hash,
          validator: validatorAddress,
          reward: 0.0025,
          transactions: [newTransaction._id]
        });
      
        newBlock.hash = calculateBlockHash(newBlock); // Calculate and set the hash
        await newBlock.save();
        latestBlock = newBlock;
      } else {
        latestBlock = blocks[blocks.length - 1];
        const previousBlockHash = latestBlock.hash; // Store the hash of the previous block
         
        // Only add transactions if not the genesis block
        latestBlock.transactions.push(newTransaction._id);
      
        if (latestBlock.transactions.length >= 5) {
          const dataToHash = latestBlock.timeStamp + JSON.stringify(latestBlock.transactions) + previousBlockHash; // Use previous block's hash
          const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
          latestBlock.hash = hash;
      
          const randomValidatorIndex = Math.floor(Math.random() * validators.length);
          const randomValidator = validators[randomValidatorIndex];
          const validatorAddress = randomValidator.address;
      
          const newBlock = new Block({
            slot: latestBlock.slot + 1,
            previousHash: previousBlockHash, // Use the stored previous block hash
            validator: validatorAddress,
            reward: 0.0015,
            transactions: []
          });
      
          newBlock.hash = calculateBlockHash(newBlock); // Calculate and set the hash
          await newBlock.save();
          latestBlock = newBlock;
        }
      
        await latestBlock.save();
      }

      await nativeCoin.save();
      await airdropVRTAccount.save();
      await gamerVRTAccount.save();
      await newTransaction.save();

      const validator = await Validator.findOne({ address: latestBlock.validator });

      if (validator) {
        validator.transactions.push(newTransaction._id);
        await validator.save();
      }

      if (airdropAccount) {
        // Add transaction ID to the airdrop's transactions
        airdropAccount.transactions.push(newTransaction._id);
        await airdropAccount.save();
      }
      
      if (airdropVRTAccount) {
        // Add transaction ID to the airdrop VRT account's transactions
        airdropVRTAccount.transactions.push(newTransaction._id);
        await airdropVRTAccount.save();
      }
      
      if (gamerVRTAccount) {
        // Add transaction ID to the gamer's VRTaccount's transactions
        gamerVRTAccount.transactions.push(newTransaction._id);
        await gamerVRTAccount.save();
      }
      
      await PendingTransaction.findByIdAndDelete(pendingTransaction._id);
      

      return res.status(200).json({ message: 'Transaction completed successfully', transaction: newTransaction });
    } else {
      console.log(`Pending transaction has ${confirmations} confirmations out of ${requiredConfirmations} required.`);
    }

    return res.status(201).json({
      message: "Airdrop successful",
      transaction: pendingTransaction
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during the airdrop",
      error: error.message
    });
  }
});


function calculateBlockHash(block) {
  const dataToHash = block.timeStamp + JSON.stringify(block.transactions) + block.previousHash;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

router.post("/transfer", async (req, res) => {
  try {
    const { recipientPublicKey, amount } = req.body;
    const senderGamerId = req.gamer._id;

    if (!recipientPublicKey || !amount) {
      return res.status(400).json({ message: 'Recipient public key and amount are required' });
    }

    // Find the sender gamer using the gamer ID
    const sender = await Gamer.findOne({ _id: senderGamerId }).populate('account');
    if (!sender) {
      return res.status(404).json({ message: 'Sender gamer not found' });
    }

    // Extract sender's nested account details
    const senderAccount = sender.account;
    if (!senderAccount) {
      return res.status(404).json({ message: 'Sender account not found' });
    }

    // Find the sender VRT account using the account ID
    const senderVRTAccount = await VRTAccount.findById(senderAccount.vrtAccount);
    if (!senderVRTAccount) {
      return res.status(404).json({ message: 'Sender VRT account not found' });
    }

    const senderBeginningBalance = senderVRTAccount.balance;

    // Find the recipient account using public key
    const recipientAccount = await Account.findOne({ publicKey: recipientPublicKey });
    if (!recipientAccount) {
      return res.status(404).json({ message: 'Recipient account not found' });
    }

    // Find the recipient VRT account using the account ID
    const recipientVRTAccount = await VRTAccount.findById(recipientAccount.vrtAccount);
    if (!recipientVRTAccount) {
      return res.status(404).json({ message: 'Recipient VRT account not found' });
    }

    const recipientBeginningBalance = recipientVRTAccount.balance;

    if (senderVRTAccount._id.equals(recipientVRTAccount._id)) {
      return res.status(400).json({ message: 'Cannot transfer to self' });
    }

    if (senderVRTAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const senderPrivateKey = senderAccount.privateKey;
    if (!senderPrivateKey) {
      return res.status(500).json({ message: 'Sender private key not found' });
    }

    const zennies = amount * 100;
    const message = JSON.stringify({
      sender: senderAccount.publicKey,
      recipient: recipientPublicKey,
      amount: zennies,
      type: 'transfer',
      signStamp: Date.now()
    });

    const signature = Keypair.sign(message, senderPrivateKey);

    const pendingTransaction = new PendingTransaction({
      sender: {
        id: senderAccount._id,
        publicKey: senderAccount.publicKey,
        beginningBalance: senderBeginningBalance,
        endingBalance: senderBeginningBalance - zennies
      },
      recipient: {
        id: recipientAccount._id,
        publicKey: recipientAccount.publicKey,
        beginningBalance: recipientBeginningBalance,
        endingBalance: recipientBeginningBalance + zennies
      },
      type: 'transfer',
      amount: zennies,
      signer: senderAccount._id,
      signature: signature,
      confirmations: 0,
      fee: 0.00,
      complete: false
    });

    await pendingTransaction.save();

    const globalState = await GlobalState.findOne({ key: 'validatorIndex' });
    let currentIndex = globalState ? globalState.value : 0;

    const validators = await Validator.find({ active: true, stake: { $gt: 0 } }).sort({ index: 1 });

    const requiredConfirmations = 20;
    let confirmations = 0;
    let validatorsCount = 0;

    for (let i = 0; i < validators.length; i++) {
      const validator = validators[(currentIndex + i) % validators.length];
      const isValid = Keypair.verify(message, pendingTransaction.signature, senderAccount.publicKey);
      validatorsCount++;
      if (isValid) {
        confirmations++;
      } else {
        console.error(`Invalid signature for validator: ${validator.address}`);
      }

      if (confirmations >= requiredConfirmations) {
        currentIndex = (currentIndex + i + 1) % validators.length;
        break;
      }
    }

    await GlobalState.updateOne(
      { key: 'validatorIndex' },
      { value: currentIndex },
      { upsert: true }
    );

    pendingTransaction.confirmations = confirmations;

    if (confirmations >= requiredConfirmations) {
      const newTransaction = new Transaction({
        sender: pendingTransaction.sender,
        recipient: pendingTransaction.recipient,
        type: pendingTransaction.type,
        amount: pendingTransaction.amount,
        signer: pendingTransaction.signer,
        signature: pendingTransaction.signature,
        confirmations: pendingTransaction.confirmations,
        fee: pendingTransaction.fee,
        complete: true
      });

      senderVRTAccount.balance -= zennies;
      recipientVRTAccount.balance += zennies;

      const blocks = await Block.find({});
      let latestBlock;

      if (blocks.length === 0) {
        const randomValidatorIndex = Math.floor(Math.random() * validators.length);
        const randomValidator = validators[randomValidatorIndex];
        const validatorAddress = randomValidator.address;

        latestBlock = new Block({
          slot: 0,
          previousHash: '0',
          validator: validatorAddress,
          reward: 0.0025,
          transactions: []
        });

        latestBlock.hash = calculateBlockHash(latestBlock);
        await latestBlock.save();

        const newBlock = new Block({
          slot: latestBlock.slot + 1,
          previousHash: latestBlock.hash,
          validator: validatorAddress,
          reward: 0.0025,
          transactions: [newTransaction._id]
        });

        newBlock.hash = calculateBlockHash(newBlock);
        await newBlock.save();
        latestBlock = newBlock;
      } else {
        latestBlock = blocks[blocks.length - 1];
        const previousBlockHash = latestBlock.hash;

        latestBlock.transactions.push(newTransaction._id);

        if (latestBlock.transactions.length >= 5) {
          const dataToHash = latestBlock.timeStamp + JSON.stringify(latestBlock.transactions) + previousBlockHash;
          const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
          latestBlock.hash = hash;

          const randomValidatorIndex = Math.floor(Math.random() * validators.length);
          const randomValidator = validators[randomValidatorIndex];
          const validatorAddress = randomValidator.address;

          const newBlock = new Block({
            slot: latestBlock.slot + 1,
            previousHash: previousBlockHash,
            validator: validatorAddress,
            reward: 0.0025,
            transactions: []
          });

          newBlock.hash = calculateBlockHash(newBlock);
          await newBlock.save();
          latestBlock = newBlock;
        }

        await latestBlock.save();
      }

      await senderVRTAccount.save();
      await recipientVRTAccount.save();
      await newTransaction.save();

      const validator = await Validator.findOne({ address: latestBlock.validator });

      if (validator) {
        validator.transactions.push(newTransaction._id);
        await validator.save();
      }

      senderVRTAccount.transactions.push(newTransaction._id);
      recipientVRTAccount.transactions.push(newTransaction._id);

      await PendingTransaction.findByIdAndDelete(pendingTransaction._id);

      return res.status(200).json({ message: 'Transaction completed successfully', transaction: newTransaction });
    } else {
      console.log(`Pending transaction has ${confirmations} confirmations out of ${requiredConfirmations} required.`);
    }

    return res.status(201).json({
      message: "Transfer successful",
      transaction: pendingTransaction
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during the transfer",
      error: error.message
    });
  }
});




module.exports = router;