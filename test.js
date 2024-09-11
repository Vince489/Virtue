const Keypair = require('./src/utils/keypair');

// Example usage
const { seedPhrase, keypair } = Keypair.generate(); // Generate keypair and seed phrase
console.log('Generated Seed Phrase:', seedPhrase);
console.log('Generated Public Key:', keypair.publicKey);
console.log('Generated Private Key:', keypair.privateKey);

// Recover the keypair using the same seed phrase
const recoveredKeypair = Keypair.fromSeedPhrase(seedPhrase);
console.log('Recovered Public Key:', recoveredKeypair.publicKey);
console.log('Recovered Private Key:', recoveredKeypair.privateKey);

module.exports = Keypair;
