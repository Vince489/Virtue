const mongoose = require('mongoose');

const airdropAccountSchema = new mongoose.Schema({
  address: {
    type: String,
    default: 'AirDropZ2ed1VVvQvzyxpUkhkMghLf3BBBVtFVBpX6KY'
  },
  publicKey: {
    type: String,
    required: true,
  },
  privateKey: {
    type: String,
    required: true,
  },
  vrtAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'vrtAccount',
    default: null
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

const AirdropAccount = mongoose.model('AirdropAccount', airdropAccountSchema);

module.exports = AirdropAccount;
