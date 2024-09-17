const express = require("express");
const router = express.Router();


const BlockchainRoutes = require("./../domains/blockchain");
const BlockRoutes = require("./../domains/block");
const AccountRoutes = require("./../domains/account");
const VRTAccountRoutes = require("./../domains/vrtAccount");
const VRTRoutes = require("./../domains/vrt");
const TokenRoutes = require("./../domains/token");
const ManagerContractRoutes = require("./../domains/managerContract");


router.use("/blockchain", BlockchainRoutes);
router.use("/block", BlockRoutes);
router.use("/account", AccountRoutes);
router.use("/vrtAccount", VRTAccountRoutes);
router.use("/vrt", VRTRoutes);
router.use("/token", TokenRoutes);
router.use("/managerContract", ManagerContractRoutes);


module.exports = router;
