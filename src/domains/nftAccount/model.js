const mongoose = require('mongoose');

const nftAccountSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account', 
    required: true,  // Ensure owner is required
  },
  nft: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFT',
  }],
  publicKey: {
    type: String,
    required: true,
    unique: true,
  },
  isFrozen: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

const NFTAccount = mongoose.model('NFTAccount', nftAccountSchema);

module.exports = NFTAccount;
