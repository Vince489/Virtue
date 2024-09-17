const mongoose = require('mongoose');

const vrtAccountSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  coin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VRT',
  },
  publicKey: {
    type: String,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  isFrozen: {
    type: Boolean,
    default: false,
  },
  airdropReceived: {
    type: Boolean,
    default: false,
  },
  airdrops: [{
    airdropId: String,
    amount: Number,
    receivedAt: Date,
  }],
  nonce: {
    type: Number,
    default: 0,
  },
  transactionCount: {
    type: Number,
    default: 0,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VRTAccount = mongoose.model('VRTAccount', vrtAccountSchema);

module.exports = VRTAccount;
