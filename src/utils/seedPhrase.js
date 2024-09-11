const bip39 = require('bip39');
const crypto = require('crypto');

class Mnemonic {
  static generate() {
    const seedPhrase = bip39.generateMnemonic();
    return { seedPhrase };
  }

  static mnemonicToSeedSync(seedPhrase) {
    return bip39.mnemonicToSeedSync(seedPhrase);
  }
}

module.exports = Mnemonic;
