const express = require("express");

const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  getCartItems,
} = require("../controllers/cartController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authenticate(["customer", "distributor", "store"]), addToCart);

router.post(
  "/increment",
  authenticate(["customer", "distributor", "store"]),
  incrementQuantity
);

router.post(
  "/decrement",
  authenticate(["customer", "distributor", "store"]),
  decrementQuantity
);

router.post(
  "/remove",
  authenticate(["customer", "distributor", "store"]),
  removeFromCart
);

router.get(
  "/",
  authenticate(["customer", "distributor", "store"]),
  getCartItems
);

module.exports = router;
