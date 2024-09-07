require("dotenv").config();

const express = require("express");
const router = express.Router();
const Mnemonic = require("./../../utils/seedPhrase"); // Your custom Mnemonic class
const Keypair = require("./../../utils/keypair"); // Your custom Keypair class
const Account = require("./model");
const SeedPhrase = require("./../seedPhrase/model");
const VRTAccount = require("./../vrtAccount/model");
const Password = require("./../password/model");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create a new account 
router.post('/', async (req, res, next) => {
  try {
    // 1. Generate seed phrase and keypair using your custom classes
    const keypair = Keypair.generate();
    const seedPhrase = Mnemonic.generate()

    // 2. Hash the password before saving it
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Create a new seed phrase document
    const newSeedPhrase = new SeedPhrase({
      seedPhrase: seedPhrase.seedPhrase,
    });

    // Save the new seed phrase to the database
    await newSeedPhrase.save();

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create a new Password entry in the DB
    const passwordEntry = new Password({
      hashedPassword: hashedPassword
    });
    await passwordEntry.save();


    // 4. Create a new VRTAccount associated with the account
    const vrtAccount = new VRTAccount({
      publicKey: keypair.publicKey,
      balance: 0,
      owner: null,
    });
    await vrtAccount.save();

    // 5. Create the account and save in DB
    const newAccount = new Account({
      seedPhrase: newSeedPhrase._id, 
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
      vrtAccount: vrtAccount._id,
      tokenAccount: [],
      stake: [],
    });
    await newAccount.save();

    // 7. Update the VRTAccount's owner field to link back to the newly created account
    vrtAccount.owner = newAccount._id;
    await vrtAccount.save();

    // 8. Create JWT with the password document's ID
    const token = jwt.sign({ passwordId: passwordEntry._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 9. Send JWT in an HttpOnly cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600000
    });

    // 10. Respond with the account info
    res.json({
      message: "Account created successfully",
      account: {
        publicKey: newAccount.publicKey,
        vrtAccountId: vrtAccount._id,
      },
    });

  } catch (error) {
    next(error);
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Extract the JWT token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication token is required" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify JWT and extract passwordId
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const passwordId = decoded.passwordId;

    // Retrieve the password document from MongoDB
    const passwordEntry = await Password.findById(passwordId);
    if (!passwordEntry) {
      return res.status(404).json({ error: "Password entry not found" });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, passwordEntry.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Find the associated account (if needed)
    const account = await Account.findOne({ passwordId: passwordId }).populate("vrtAccount");
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Respond with account details
    res.json({
      message: "Login successful",
      account: {
        publicKey: account.publicKey,
        vrtAccountId: account.vrtAccount._id,
      },
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
