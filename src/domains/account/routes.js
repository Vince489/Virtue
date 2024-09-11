const express = require("express");
const router = express.Router();

const Mnemonic = require("./../../utils/seedPhrase"); 
const Keypair = require("./../../utils/keypair"); 
const Account = require("./model");
const VRTAccount = require("./../vrtAccount/model");
const Password = require("./../password/model");
const VRT = require("./../vrt/model");
const Token = require("./../token/model");
const TokenAccount = require("./../tokenAccount/model");
const { encryptData } = require("./../../utils/encrypt-decrypt");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); 

// Use cookie-parser middleware
router.use(cookieParser());


// Create a new account 
router.post('/', async (req, res, next) => {
  try {
    // Generate seed phrase and derive keypair from it
    const seedPhrase = Mnemonic.generate(); // Generate seed phrase
    const keypair = Keypair.fromSeedPhrase(seedPhrase.seedPhrase);  // Derive keypair from the seed phrase

    // Hash the password before saving it
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Check for duplicate public key
    const existingAccount = await Account.findOne({ publicKey: keypair.publicKey });
    if (existingAccount) {
      return res.status(400).json({ error: `Public key ${keypair.publicKey} already exists` });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Encrypt the private key before storing it in the database
    const encryptedPrivateKey = encryptData(keypair.privateKey, process.env.SECRET);

    // Create a new Password entry in the DB
    const passwordEntry = new Password({
      hashedPassword: hashedPassword,
    });
    await passwordEntry.save();

    // Find native coin (VRT) for the user
    const nativeCoin = await VRT.findOne({ symbol: 'VRT' });

    // Generate publickey for VRTAccount
    const vrtAccountPublickey = Keypair.generatePublicKey();
    // Log keypair details
    if (!vrtAccountPublickey) {
      throw new Error('VRTAccount publicKey is null or undefined');
    }

    // Create the VRTAccount
    const vrtAccount = new VRTAccount({
      publicKey: vrtAccountPublickey,
      coin: nativeCoin._id,
      owner: null,
    });
    await vrtAccount.save();

    // Create the main account
    const newAccount = new Account({
      passwordId: passwordEntry._id,
      publicKey: keypair.publicKey,
      privateKey: encryptedPrivateKey, // Store encrypted private key
      vrtAccount: vrtAccount._id,
      tokenAccount: [], // Initialize as an empty array
      stake: [],
    });
    await newAccount.save();

    // Update VRTAccount owner
    vrtAccount.owner = newAccount._id;
    await vrtAccount.save();

    // Create JWT with the password document's ID
    const token = jwt.sign({ passwordId: passwordEntry._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send JWT in an HttpOnly cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 3600000,
    });

    // Respond with account info
    res.status(201).json({
      message: "Account created successfully",
      account: {
        seedPhrase: seedPhrase.seedPhrase,
        publicKey: newAccount.publicKey,
      },
    });

  } catch (error) {
    console.error('Error creating account:', error);  // More detailed error logging
    next(error);
  }
});


// Create a new account 
router.post('/1', async (req, res, next) => {
  try {
    // Generate seed phrase and derive keypair from it
    const seedPhrase = Mnemonic.generate(); // Generate seed phrase
    const keypair = Keypair.fromSeedPhrase(seedPhrase.seedPhrase);  // Derive keypair from the seed phrase

    // Hash the password before saving it
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Check for duplicate public key
    const existingAccount = await Account.findOne({ publicKey: keypair.publicKey });
    if (existingAccount) {
      return res.status(400).json({ error: `Public key ${keypair.publicKey} already exists` });
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Password entry in the DB
    const passwordEntry = new Password({
      hashedPassword: hashedPassword,
    });
    await passwordEntry.save();

    // Find native coin (VRT) for the user
    const nativeCoin = await VRT.findOne({ symbol: 'VRT' });

    // Generate keypair for VRTAccount
    const vrtAccountKeypair = Keypair.generate();

    // Log keypair details
    if (!vrtAccountKeypair.keypair.publicKey) {
      throw new Error('VRTAccount publicKey is null or undefined');
    }

    // Create the VRTAccount
    const vrtAccount = new VRTAccount({
      publicKey: vrtAccountKeypair.keypair.publicKey,
      coin: nativeCoin._id,
      owner: null,
    });
    await vrtAccount.save();

    // Create the main account
    const newAccount = new Account({
      passwordId: passwordEntry._id,
      publicKey: keypair.publicKey,
      privateKey: keypair.privateKey,
      vrtAccount: vrtAccount._id,
      tokenAccount: [], // Initialize as an empty array
      stake: [],
    });
    await newAccount.save();

    // Update VRTAccount owner
    vrtAccount.owner = newAccount._id;
    await vrtAccount.save();

    // Create JWT with the password document's ID
    const token = jwt.sign({ passwordId: passwordEntry._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send JWT in an HttpOnly cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 3600000,
    });

    // Respond with account info
    res.status(201).json({
      message: "Account created successfully",
      account: {
        seedPhrase: seedPhrase.seedPhrase,
        publicKey: newAccount.publicKey,
      },
    });

  } catch (error) {
    console.error('Error creating account:', error);  // More detailed error logging
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

    // Extract the JWT token from the cookies
    const token = req.cookies.session_token;
    if (!token) {
      console.log("No token found in cookies"); // Debugging line
      return res.status(401).json({ error: "Authentication token is required" });
    }

    // Verify JWT and extract passwordId
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("Token verification failed", err); // Debugging line
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
    console.log('Account:', account); // Debugging line
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Respond with account details
    res.json({
      message: "Login successful"
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
