const bs58 = require('bs58');

// Convert the string to a buffer
const buffer = Buffer.from('hello world');

// Encode the buffer to base58
const ruy = bs58.encode(buffer);

console.log(ruy); // Encoded base58 string
