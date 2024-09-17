const express = require('express');
const router = express.Router();
const BoutContract = require('../boutContract/model');
const verifyToken = require('../../middleware/auth');


// Define the endpoint
router.post('/', verifyToken, async (req, res) => {
  try {
    const boutContract = new BoutContract(req.body);
    await boutContract.save();
    res.status(201).send(boutContract);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;