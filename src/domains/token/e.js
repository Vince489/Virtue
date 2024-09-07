const mongoose = require('mongoose');
const { Keypair, Mnemonic } = require('your-crypto-library'); // Replace with your actual crypto library
const Token = require('./models/token'); // Import your Token model
const TokenAccount = require('./models/tokenAccount'); // Import your TokenAccount model
const SeedPhrase = require('./models/seedPhrase'); // Import your SeedPhrase model
const Account = require('./models/account'); // Import your Account model

router.post('/2', authenticateToken, async (req, res, next) => {
  try {
    // Check if the gamer already has an associated account
    if (req.gamer.gamer.gamer.account) {
      return res.status(400).json({ message: 'Gamer already has an associated account' });
    }

    // Generate a new key pair and seed phrase
    const keypair = Keypair.generate();
    const seedPhrase = Mnemonic.generate();

    // Create a new seed phrase document
    const newSeedPhrase = new SeedPhrase({
      seedPhrase: seedPhrase.seedPhrase,
    });

    // Save the new seed phrase to the database
    await newSeedPhrase.save();

    // Create a new account associated with the seed phrase
    const newAccount = new Account({
      seedPhrase: newSeedPhrase._id, // Reference the saved seed phrase document
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
    });

    // Save the new account to the database
    await newAccount.save();

    // Retrieve the seed phrase document from the database using its ID
    const retrievedSeedPhrase = await SeedPhrase.findById(newSeedPhrase._id);    

    // Associate the account with the gamer using the middleware
    await associateAccountWithGamer(newAccount._id, req.gamer.gamer.gamer._id);    

    // Retrieve the native coin token (replace 'NativeCoin' with your actual token name)
    const nativeCoinToken = await Token.findOne({ name: 'Native Coin' });

    // Create a new token account associated with the new account and native coin token
    const newTokenAccount = new TokenAccount({
      owner: newAccount._id,
      token: nativeCoinToken._id,
      publicKey: Keypair.generate().publicKey,
    });

    // Save the new token account to the database
    await newTokenAccount.save();

    // Associate the account with the gamer using the middleware
    await associateTokenAccount(newAccount._id, req.gamer.gamer.newTokenAccount._id); 



    // Respond with the newly created account data, the seed phrase, and the associated token account
    res.status(201).json({
      account: newAccount,
      seedPhrase: retrievedSeedPhrase.seedPhrase,
      tokenAccount: newTokenAccount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
