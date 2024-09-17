const express = require("express");
const router = express.Router();

const Blockchain = require('../blockchain/model');
const Block = require('../block/model');

// Initialize a new blockchain
router.post("/init", async (req, res, next) => {
  try {
    const { name, consensusRules } = req.body;

    // Create a new blockchain document
    const newBlockchain = new Blockchain({
      name,
      consensusRules,
    });

    // Save the new blockchain document to the database
    await newBlockchain.save();

    // Create the genesis block
    const genesisBlock = new Block({
      slot: 0, // Typically, the first block has a slot of 0
      previousHash: null, // Genesis block has no previous hash
      transactions: [], // No transactions in the genesis block
      validator: null, // Placeholder for genesis block validator
      reward: 0, // Set as needed
    });

    // Save the genesis block to the database
    await genesisBlock.save();

    // Add the genesis block to the blockchain
    newBlockchain.blocks.push(genesisBlock._id);
    await newBlockchain.save();

    res.status(201).json(newBlockchain);
  } catch (error) {
    next(error);
  }
});

// Get all blockchains
router.get("/", async (req, res, next) => {
  try {
    const blockchains = await Blockchain.find();
    res.json(blockchains);
  } catch (error) {
    next(error);
  }
});

// Get a specific blockchain by name
router.get("/:name", async (req, res, next) => {
  try {
    const { name } = req.params;
    const blockchain = await Blockchain.findOne({ name });
    res.json(blockchain);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
