const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  publicKey: {
    type: String,
    unique: true,
    required: true,
  },
  privateKey: {
    type: String,
    unique: true,
    required: true,
    select: false, // Hide in queries
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  vrtAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VRTAccount',
  },
  tokenAccounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TokenAccount',
  }],
  nftAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NFTAccount',
  },
  stake: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stake',
  }],
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
