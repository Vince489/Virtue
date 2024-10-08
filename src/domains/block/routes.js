const express = require("express");
const router = express.Router();
const Block = require("./model");
const Blockchain = require('../blockchain/model');
const Transaction = require('../transaction/model');

// get all blocks
router.get("/", async (req, res, next) => {
  try {
    const blocks = await Block.find();
    res.json(blocks);
  } catch (error) {
    next(error);
  }
});

// Create a new block
function createBlock(transactions, previousHash, blockHeight, validator, validatorSignature) {
  // Create the block
  const newBlock = new Block({
    timeStamp: new Date(),
    blockHeight: blockHeight,
    previousHash: previousHash,
    transactions: transactions,
    validator: validator,
    validatorSignature: validatorSignature
  });

  return newBlock;
}

// create genesis block
router.post("/genesis", async (req, res, next) => {
  try {
    const genesisBlock = new Block({
      blockHeight: 0,
      previousHash: '0',
      transactions: [],
    });

    await genesisBlock.save();

    res.status(201).json(genesisBlock);
  } catch (error) {
    next(error);
  }
});



// Create a new block
router.post("/", async (req, res, next) => {
  try {
    // Find the maximum blockHeight in the existing blocks
    const maxBlock = await Block.findOne().sort({ blockHeight: -1 });

    let newBlockHeight = 0;

    if (maxBlock) {
      // If there are existing blocks, increment the blockHeight
      newBlockHeight = maxBlock.blockHeight + 1;
    }
    

    const newBlock = new Block({
      // Other fields...
      blockHeight: newBlockHeight // Set the blockHeight for the new block
    });

    await newBlock.save();

    res.status(201).json(newBlock);
  } catch (error) {
    next(error);
  }
});


// Add a new transaction to the pending transactions of a specific blockchain
router.post("/:blockchainId/addTransaction", async (req, res, next) => {
  try {
    const blockchainId = req.params.blockchainId;
    const { senderPublicKey, recipientPublicKey, amount } = req.body;

    // Find the blockchain by ID
    const blockchain = await Blockchain.findById(blockchainId);

    if (!blockchain) {
      return res.status(404).json({ message: "Blockchain not found" });
    }

    // Create a new transaction (assuming you have a Transaction model)
    const newTransaction = new Transaction({
      sender: {
        publicKey: senderPublicKey,
        // Other sender information...
      },
      recipient: {
        publicKey: recipientPublicKey,
        // Other recipient information...
      },
      amount: amount,
    });

    // Add the new transaction to the pending transactions array of the blockchain
    blockchain.pendingTransactions.push(newTransaction);

    // Save the updated blockchain document
    await blockchain.save();

    res.status(201).json({ message: "Transaction added to pending transactions" });
  } catch (error) {
    next(error);
  }
});



module.exports = router;
