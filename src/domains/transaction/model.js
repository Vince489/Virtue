// transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    publicKey: {
      type: String,
      required: true,
    },
    beginningBalance: {
      type: Number,
    },
    endingBalance: {
      type: Number,
    },
  },
  recipient: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    publicKey: {
      type: String,
      required: true,
    },
    beginningBalance: {
      type: Number,
    },
    endingBalance: {
      type: Number,
    },
  },
  type: {
    type: String,
    enum: ['transfer', 'stake', 'airdrop', 'create_account', 'create_token', 'mint_token', 'burn_token'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  signer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  },
  signature: {
    type: String,
    required: true,
  },    
  timestamp: {
    type: Date,
    default: new Date().toISOString(),
  },
  confirmations: {
    type: Number,
    default: 0,
  },
  fee: {
    type: Number,
    default: 0.0025,
  },
  complete: {
    type: Boolean,
    default: false,
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
  },
  token: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
