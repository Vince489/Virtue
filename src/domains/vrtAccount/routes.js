const express = require("express");
const router = express.Router();
const VRTAccount = require('./model')
const Account = require('../account/model')

// create vrtAccount for user
router.post("/", async (req, res) => {
    try {
        const account = await account.findById(req.account.id)
        if (!account) return res.status(400).json({ message: "Account not found" });
        const newVrtAccount = new vrtAccount({
            account: req.account.id,
            accountName: req.body.accountName,
            accountNumber: req.body.accountNumber,
            bankName: req.body.bankName,
            accountType: req.body.accountType,
            accountBalance: req.body.accountBalance
        });
        const vrtAccount = await newVrtAccount.save();
        res.json(vrtAccount);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;