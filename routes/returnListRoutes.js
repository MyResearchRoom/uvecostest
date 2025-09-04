const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  addReturn,
  getReturns,
} = require("../controllers/returnListController");

const router = express.Router();

router.post("/", authenticate(["productManager"]), addReturn);

router.get("/", authenticate(["productManager"]), getReturns);

module.exports = router;
