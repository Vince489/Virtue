const express = require("express");
const router = express.Router();


const BlockchainRoutes = require("./../domains/blockchain");
const BlockRoutes = require("./../domains/block");
const AccountRoutes = require("./../domains/account");


router.use("/blockchain", BlockchainRoutes);
router.use("/block", BlockRoutes);
router.use("/account", AccountRoutes);


module.exports = router;
