const express = require("express");
const { getPinCodeData } = require("../controllers/pinCodeController");
const router = express.Router();

router.get("/:pincode", getPinCodeData);

module.exports = router;
