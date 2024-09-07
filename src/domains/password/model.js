// blockchain.js

const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  hashedPassword: {
    type: String,
    required: true,
  },
})

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;