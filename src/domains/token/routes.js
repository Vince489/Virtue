const express = require("express");
const router = express.Router();
const Token = require("./model");
const Keypair = require("./../../utils/keypair");
const authenticateToken = require('../../middleware/authenticateToken');
const TokenAccount = require('../tokenAccount/model');
const { associateTokenAccount } = require('../../middleware/openAccount');
const Account = require('../account/model');




// Create a new token
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      uri,
      symbol,
    } = req.body;

    // Perform validation checks, e.g., checking if required fields are present

    if (!symbol || !name) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Generate a key pair using the Keypair library
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey;    

    // Check if token already exists in the database with the same publicKey, symbol, or name
    const existingToken = await Token.findOne({ $or: [{ mint: publicKey }, { symbol }, { name }] })

    if (existingToken) {
      return res.status(400).json({ message: 'Token with the same name, mint, or symbol already exists' });
    }


    // Create a new token
    const token = new Token({
      name,
      mint: publicKey,
      address: publicKey,
      mintAuthority: req.gamer.gamer.gamer._id,
      uri,
      symbol,
    });

    // Save the new token to the database
    await token.save();

    // Respond with the newly created token
    res.status(200).json({ message: 'Token created successfully.', token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mint', authenticateToken, async (req, res, next) => {
  try {
    const { mintAmount } = req.body;

    // Check if the required mintAmount is provided
    if (!mintAmount || isNaN(mintAmount) || mintAmount <= 0) {
      return res.status(400).json({ error: 'Invalid or missing mintAmount.' });
    }

    // Extract the gamer ID from the decoded token
    const gamerId = req.gamer.gamer.gamer._id;

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

// Endpoint to mint tokens

router.post('/mint2', authenticateToken, async (req, res, next) => {
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

router.post('/mint3', authenticateToken, async (req, res, next) => {
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

router.post('/mint4', authenticateToken, async (req, res, next) => {

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



