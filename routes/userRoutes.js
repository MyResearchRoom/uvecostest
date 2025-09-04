const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  getCustomers,
} = require("../controllers/userController");

const router = express.Router();

router.get("/customers", authenticate(["platformUser"]), getCustomers)

module.exports = router;
