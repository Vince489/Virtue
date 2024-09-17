const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  passwordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Password',
  },
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
  }]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
