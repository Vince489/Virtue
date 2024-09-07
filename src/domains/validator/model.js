const mongoose = require('mongoose');

const validatorSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true, // Each validator's address should be unique
  },
  owner: {
    type: String, 
    required: true,
  },
  stake: {
    type: Number,
    required: true,
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
  active: {
    type: Boolean,
    default: true, // Validators are active by default
  },
  index: {
    type: Number,
    required: true,
  },
});

const Validator = mongoose.model('Validator', validatorSchema);

module.exports = Validator;
