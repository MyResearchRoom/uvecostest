const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  addWarranty,
  getWarraties,
} = require("../controllers/warrantyListController");
const router = express.Router();

router.post("/", authenticate(["productManager"]), addWarranty);

router.get("/", authenticate(["productManager"]), getWarraties);

module.exports = router;
