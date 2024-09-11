const express = require("express");
const router = express.Router();
const Token = require("./model");
const Keypair = require("./../../utils/keypair");
const TokenAccount = require('../tokenAccount/model');
const Account = require('../account/model');


// POST /api/v2/token - Create a new token
router.post('/', async (req, res) => {
  try {
    const { name, uri, symbol, mintAuthority, freezeAuthority } = req.body;

    // Validate required fields
    if (!name || !symbol || !uri || !mintAuthority) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Generate a new publicKey for the token (could be custom logic or use your existing Keypair class)
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey;

    // Check if token with the same name, symbol, or mint already exists
    const existingToken = await Token.findOne({
      $or: [{ mint: publicKey }, { symbol }, { name }]
    });

    if (existingToken) {
      return res.status(400).json({ message: 'Token with the same name, mint, or symbol already exists.' });
    }

    // Create the new token object with mintAuthority and freezeAuthority as strings
    const token = new Token({
      name,
      mint: 'BmbgmWKToM3VZBRDjfKL6ptAsPqhpGGSNtEgVjojLSdH',
      address: 'BmbgmWKToM3VZBRDjfKL6ptAsPqhpGGSNtEgVjojLSdH',  // Assuming mint and address are the same
      mintAuthority,  // Use the mintAuthority string provided in the request body
      freezeAuthority: freezeAuthority || null,  // Optional freeze authority
      uri,
      symbol
    });

    // Save the token in the database
    await token.save();

    // Respond with the created token
    res.status(201).json({ message: 'Token created successfully.', token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v2/token/mint - Mint new tokens to a generated token account
router.post('/mint', async (req, res) => {
  try {
    const { tokenId, ownerId, amount } = req.body;

    // Validate required fields
    if (!tokenId || !ownerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Missing required fields or invalid amount.' });
    }

    // Find the token by ID
    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ error: 'Token not found.' });
    }

    // Find the owner by ID
    const owner = await Account.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: 'Owner account not found.' });
    }

    // Generate a new publicKey for the token account (could be custom logic or use your existing Keypair class)
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey;

    // Check if a TokenAccount already exists for this owner and token
    const existingTokenAccount = await TokenAccount.findOne({ owner: ownerId, token: tokenId });
    if (existingTokenAccount) {
      return res.status(400).json({ message: 'Token account already exists for this owner and token.' });
    }

    // Create a new token account for the owner
    const tokenAccount = new TokenAccount({
      owner: owner._id,
      token: token._id,
      publicKey,  // Generated public key
      balance: amount,  // Start with the minted amount
    });

    // Save the token account in the database
    await tokenAccount.save();

    // Update the total supply of the token
    token.totalSupply += amount;
    await token.save();

    // Respond with the created token account
    res.status(201).json({ message: 'Tokens minted successfully.', tokenAccount, totalSupply: token.totalSupply });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Endpoint to mint tokens

router.post('/mint2', async (req, res, next) => {
  try {
    const { mintAmount } = req.body;

    // Check if the required mintAmount is provided
    if (!mintAmount || isNaN(mintAmount) || mintAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing mintAmount.' });
    }

    // Extract the gamer ID from the decoded token
    const gamerId = req.gamer.gamer.gamer._id;


    // Retrieve Account obj id using gamer ID
    const account = await Account.findOne({ account: req.gamer.gamer.gamer.account });

    console.log('Account:', account);


    // Retrieve the token based on the gamer ID
    const token = await Token.findOne({ mintAuthority: gamerId });

    if (!token) {
      return res.status(404).json({ error: 'Token not found for the provided mintAuthority.' });
    }

    // Check if the token's mintAuthority matches the gamer's ID
    if (token.mintAuthority.toString() !== gamerId.toString()) {
      return res.status(403).json({ error: 'Permission denied. MintAuthority does not match.' });
    }

    // Check if the gamer already has a token account, if not create one
    const existingTokenAccount = await TokenAccount.findOne({ owner: gamerId, token: token._id });

    // Create a new token account or use the existing one
    const newTokenAccount = existingTokenAccount || new TokenAccount({
      owner: gamerId,
      token: token._id,
      publicKey: Keypair.generate().publicKey,
    });

    // Update the balance (add mintAmount)
    newTokenAccount.balance += mintAmount;

    // Save the new token account to the database if it's a new account
    if (!existingTokenAccount) {
      await newTokenAccount.save();
    } else {
      // Update the existing token account's balance
      await TokenAccount.findOneAndUpdate(
        { _id: existingTokenAccount._id },
        { balance: newTokenAccount.balance },
        { new: true }
      );
    }

    // Update the token's totalSupply and save
    token.totalSupply += mintAmount;
    await token.save();

    // Push the new token account to the gamer's account
    account.tokenAccounts.push(newTokenAccount._id);
    await account.save();
    console.log('Account:', account.tokenAccounts);

    // Respond with success message and updated tokenAccount balance
    res.status(200).json({
      message: 'Token minted successfully.',
      balance: newTokenAccount.balance,
    });
  } catch (error) {
    console.error('Error minting tokens:', error.message);
    next(error);
  }
});

router.post('/mint3', async (req, res, next) => {
  try {
    const { mintAmount } = req.body;

    // Check if the required mintAmount is provided
    if (!mintAmount || isNaN(mintAmount) || mintAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing mintAmount.' });
    }

    // Extract the gamer ID from the decoded token
    const gamerId = req.gamer.gamer.gamer._id;

    // Retrieve Account obj id using gamer ID
    const account = await Account.findOne({ account: req.gamer.gamer.gamer.account });

    // Retrieve the token based on the gamer ID
    const token = await Token.findOne({ mintAuthority: gamerId });

    if (!token) {
      return res.status(404).json({ error: 'Token not found for the provided mintAuthority.' });
    }

    // Check if the token's mintAuthority matches the gamer's ID
    if (token.mintAuthority.toString() !== gamerId.toString()) {
      return res.status(403).json({ error: 'Permission denied. MintAuthority does not match.' });
    }

    // Check if the gamer already has a token account, if not create one
    const existingTokenAccount = await TokenAccount.findOne({ owner: gamerId, token: token._id });

    // Create a new token account or use the existing one
    const newTokenAccount = existingTokenAccount || new TokenAccount({
      owner: gamerId,
      token: token._id,
      publicKey: Keypair.generate().publicKey,
    });

    // Update the balance (add mintAmount)
    newTokenAccount.balance += mintAmount;

    // Save the new token account to the database if it's a new account
    if (!existingTokenAccount) {
      await newTokenAccount.save();
    } else {
      // Update the existing token account's balance
      await TokenAccount.findOneAndUpdate(
        { _id: existingTokenAccount._id },
        { balance: newTokenAccount.balance },
        { new: true }
      );
    }

    // Update the token's totalSupply and save
    token.totalSupply += mintAmount;
    await token.save();

    // Push the new token account to the gamer's account
    account.tokenAccounts.push(newTokenAccount._id);
    await account.save();

    // Respond with success message and updated tokenAccount balance
    res.status(200).json({
      message: 'Token minted successfully.',
      balance: newTokenAccount.balance,
    });
  } catch (error) {
    console.error('Error minting tokens:', error.message);
    next(error);
  }
});

router.post('/mint4', async (req, res, next) => {

  try {
    const { mintAmount } = req.body;

    // Check if the required mintAmount is provided
    if (!mintAmount || isNaN(mintAmount) || mintAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing mintAmount.' });
    }

    // Extract the gamer ID from the decoded token
    const gamerId = req.gamer.gamer.gamer._id;

    // Retrieve Account obj id using gamer ID
    const account = await Account.findOne({ account: req.gamer.gamer.gamer.account });

    // Retrieve the token based on the gamer ID
    const token = await Token.findOne({ mintAuthority: gamerId });

    if (!token) {
      return res.status(404).json({ error: 'Token not found for the provided mintAuthority.' });
    }

    // Check if the token's mintAuthority matches the gamer's ID
    if (token.mintAuthority.toString() !== gamerId.toString()) {
      return res.status(403).json({ error: 'Permission denied. MintAuthority does not match.' });
    }

    // Check if the gamer already has a token account
    const existingTokenAccount = await TokenAccount.findOne({ owner: gamerId, token: token._id });

    // Create a new token account or use the existing one
    const newTokenAccount = existingTokenAccount || new TokenAccount({
      owner: gamerId,
      token: token._id,
      publicKey: Keypair.generate().publicKey,
      balance: 0, // Initialize balance to 0 for new accounts
    });

    // Update the balance (add mintAmount)
    newTokenAccount.balance += mintAmount;

    // Save the new token account to the database if it's a new account
    if (!existingTokenAccount) {
      await newTokenAccount.save();
    } else {
      // Update the existing token account's balance
      await TokenAccount.findOneAndUpdate(
        { _id: existingTokenAccount._id },
        { balance: newTokenAccount.balance },
        { new: true }
      );
    }

    // Update the token's totalSupply and save
    token.totalSupply += mintAmount;
    await token.save();

    // Associate the token account with the gamer's account if not already associated
    if (!existingTokenAccount) {
      await associateTokenAccount(account, newTokenAccount._id);
    }


    // Respond with success message and updated tokenAccount balance
    res.status(200).json({
      message: 'Token minted successfully.',
      balance: newTokenAccount.balance,
    });
  } catch (error) {
    console.error('Error minting tokens:', error.message);
    next(error);
  }
});







module.exports = router;



