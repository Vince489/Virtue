const express = require("express");
const router = express.Router();
const VRT = require("./model"); // Import the VRT model
const VRTAccount = require('../vrtAccount/model');
const Transaction = require("../transaction/model"); // Import the Transaction model
const Keypair = require('../../utils/keypair');

// Convert Tokens to zennies 1 token = 100 zennies
const tokensToZennies = (tokens) => {
  return tokens * 100;
};

// Convert Zennies to Tokens 1 zenny = 0.01 tokens
const zenniesToTokens = (zennies) => {
  return zennies / 100;
};

// Fee for transaction
const fee = 0.0025;

// Initialize the native coin
router.post("/", async (req, res, next) => {
  try {
    // Check if the native coin already exists
    const existingCoin = await VRT.findOne({ symbol: "VRT" });
    if (existingCoin) {
      return res.status(400).json({ message: "Native coin already exists" });
    }

    // Create a new native coin entry
    const newCoin = new VRT();
    await newCoin.save();

    // Respond with success message
    res.status(201).json({ message: "Native coin created successfully", coin: newCoin });
  } catch (error) {
    // Handle errors
    console.error("Error creating native coin:", error);
    res.status(500).json({ message: "Failed to create native coin" });
  }
});

// Mint native coin using the conversions
router.post("/mint", async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Retrieve the native coin from the database
    const coinToMint = await VRT.findOne({ symbol: "VRT" });

    if (!coinToMint) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Convert the amount to to zennies
    const zennies = tokensToZennies(amount);

    // Mint the zennies
    coinToMint.totalSupply += zennies;
    coinToMint.balance += zennies;
    await coinToMint.save();

    // Respond with the updated VRT balance in tokens
    res.status(200).json({ message: "Mint successful", balance: zenniesToTokens(coinToMint.totalSupply).toFixed(2) });
    } catch (error) {
    next(error);
  }
});

// Create a new native coin entry in the database
router.post("/", async (req, res, next) => {
  try {
    // Extract data from the request body
    const { name, symbol, totalSupply, balance, icon, authority, frozen } = req.body;

    // Create a new VRT token object with the provided data
    const newVRT = new VRT({
      name,
      symbol,
      totalSupply,
      balance,
      icon,
      authority,
      frozen,
    });

    // Save the new VRT token to the database
    await newVRT.save();

    // Respond with the newly created VRT token data
    res.status(201).json(newVRT);
  } catch (error) {
    next(error);
  }
});

// AirDrop VRT token to an account
router.post("/airdrop", async (req, res, next) => {
  try {
    const amount = 100
    // Find the gamer's account using their publicKey
    const gamerAccount = await VRTAccount.findOne({ owner: req.gamer._id });
    // Check if the gamer has received airdrop before
    if (gamerAccount.airdropReceived) {
      return res.status(400).json({ message: "gamer has already received airdrop" });
    }
    
    if (!gamerAccount) {
      return res.status(404).json({ message: "gamer not found" });
    }

    // Retrieve the current VRT balance from the database
    const coinToAirdrop = await VRT.findOne({ symbol: "VRT" });

    if (!coinToAirdrop) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Deduct the airdrop amount from the VRT balance
    if (coinToAirdrop.availableSupply < amount) {
      return res.status(400).json({ message: "Insufficient VRT balance for airdrop" });
    }

    // Deduct the airdrop amount from the VRT balance
    coinToAirdrop.availableSupply -= amount;
    await coinToAirdrop.save();

    // Increment the gamer's VRT balance within their account
    gamerAccount.balance += amount;
    
    // Mark airdropReceived: true
    gamerAccount.airdropReceived = true;
    await gamerAccount.save();

    // Respond with the updated VRT balance
    res.status(200).json({ message: "Airdrop successful", balance: gamerAccount.balance });
  } catch (error) {
    next(error);
  }
});

router.post("/airdrop2", async (req, res, next) => {
  try {
  const amount = 100
    // Set the default sender's public key
    const senderPublicKey = "Airdrop7LAuFgEy9YCDb1dSjNfo5FwvhmbzBU81KYwU8";

    // Set the default sender's id
    const senderId = "5f8b8b7b4d3b3b1b1b1b1b1b";

    // Find the gamer's account using their publicKey
    const gamerAccount = await VRTAccount.findOne({ owner: req.gamer._id });

    if (!gamerAccount) {
      return res.status(404).json({ message: "gamer not found" });
    }

    // Retrieve the current VRT balance from the database
    const coinToAirdrop = await VRT.findOne({ symbol: "VRT" });

    if (!coinToAirdrop) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Deduct the airdrop amount from the VRT balance of the sender
    if (coinToAirdrop.availableSupply < amount) {
      return res.status(400).json({ message: "Insufficient VRT balance for airdrop" });
    }

    // Deduct the airdrop amount from the VRT balance of the sender
    coinToAirdrop.availableSupply -= amount;
    await coinToAirdrop.save();

    // Increment the gamer's VRT balance within their account
    gamerAccount.balance += amount;

    // Mark airdropReceived: true
    gamerAccount.airdropReceived = true;
    await gamerAccount.save();

    const message = JSON.stringify({
      sender: {
        id: senderId,
        publicKey: senderPublicKey,
      },
      recipient: {
        id: gamerAccount._id,
        publicKey: gamerAccount.publicKey,
        balance: gamerAccount.balance,
      },
      amount,
      balance: gamerAccount.balance,
      type: "airdrop",
    });

    const keypair = new Keypair();
    const signature = keypair.sign(message)

    // Create a new airdrop transaction
    const airdropTransaction = new Transaction({
      sender: {
        id: senderId,
        publicKey: senderPublicKey,
      },
      recipient: {
        id: gamerAccount._id,
        publicKey: gamerAccount.publicKey,
        balance: gamerAccount.balance,
      },
      amount,
      balance: gamerAccount.balance, 
      type: "airdrop",
      signature: signature,
    });

    // Save the airdrop transaction to the database
    await airdropTransaction.save();

    // Push the transaction ID to the gamer's transaction array
    gamerAccount.transactions.push(airdropTransaction._id);

    // Save the updated gamer account to the database
    await gamerAccount.save();

    // Respond with the updated VRT balance
    res.status(200).json({ message: "Airdrop successful", balance: gamerAccount.balance });
  } catch (error) {
    next(error);
  }
});

// Retrieve VRT data for the wallet
router.get("/", async (req, res, next) => {
  try {
    // Fetch the VRT data from the database
    const vrtData = await VRT.findOne({ symbol: "VRT" });

    // Check if the VRT token exists
    if (!vrtData) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Return the VRT data in response
    res.status(200).json(vrtData);
  } catch (error) {
    console.error("Error retrieving VRT data:", error);
    res.status(500).json({ message: "Failed to retrieve VRT data" });
  }
});


// Get all VRT tokens
router.get("/", async (req, res, next) => {
  try {
    // Retrieve all VRT tokens from the database
    const allVRT = await VRT.find();

    // Respond with the retrieved VRT tokens
    res.status(200).json(allVRT);
  } catch (error) {
    next(error);
  }
});

// freeze VRT token
router.post("/freeze/:symbol", async (req, res, next) => {
  try {
    const { symbol } = req.params;

    // Retrieve the VRT token from the database
    const vrtToken = await VRT.findOne({ symbol });

    if (!vrtToken) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Freeze the VRT token
    vrtToken.frozen = true;
    await vrtToken.save();

    // Respond with the updated VRT token
    res.status(200).json(vrtToken);
  } catch (error) {
    next(error);
  }
});

// unfreeze VRT token
router.post("/unfreeze/:symbol", async (req, res, next) => {
  try {
    const { symbol } = req.params;

    // Retrieve the VRT token from the database
    const vrtToken = await VRT.findOne({ symbol });

    if (!vrtToken) {
      return res.status(404).json({ message: "VRT token not found" });
    }

    // Freeze the VRT token
    vrtToken.frozen = false;
    await vrtToken.save();

    // Respond with the updated VRT token
    res.status(200).json(vrtToken);
  } catch (error) {
    next(error);
  }
});





module.exports = router;
