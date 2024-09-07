router.post("/transfer", verifyToken, async (req, res) => {
  try {
    const { recipientPublicKey, amount } = req.body;
    const senderGamerId = req.gamer._id;

    if (!recipientPublicKey || !amount) {
      return res.status(400).json({ message: 'Recipient public key and amount are required' });
    }

    // Find the sender gamer using the gamer ID
    const sender = await Gamer.findOne({ _id: senderGamerId }).populate('account');
    console.log('sender', sender);
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
    console.log('recipientVRTAccount', recipientVRTAccount);
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

      senderAccount.transactions.push(newTransaction._id);
      recipientAccount.transactions.push(newTransaction._id);

      console.log('senderAccount:', senderAccount);
console.log('recipientAccount:', recipientAccount);


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