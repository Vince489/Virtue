// blockchain.js

const mongoose = require('mongoose');

const blockchainSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  blocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
  }],
  epoch: {
    type: Number,
    default: 0,
  },
  consensusRules: {
    type: mongoose.Schema.Types.Mixed,
    required: true, 
  }, 
})

const Blockchain = mongoose.model('Blockchain', blockchainSchema);

module.exports = Blockchain;