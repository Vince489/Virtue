const express = require("express");
const router = express.Router();
const ManagerContract = require("./model");


// Create a new contract
router.post("/", async (req, res) => {
  try {
    const contract = new ManagerContract(req.body);
    await contract.save();
    res.status(201).send(contract);
  } catch (error) {
    res.status(400).send(error);
  }
});








module.exports = router;