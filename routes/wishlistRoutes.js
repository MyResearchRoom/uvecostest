const express = require("express");
const {
  addToWishlist,
  removeFromWishlist,
  getWishlistItems,
} = require("../controllers/wishlistController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate(["customer", "distributor", "store"]),
  addToWishlist
);

router.post(
  "/move/wishlist",
  authenticate(["customer", "distributor", "store"]),
  addToWishlist
);

router.post(
  "/remove",
  authenticate(["customer", "distributor", "store"]),
  removeFromWishlist
);

router.get(
  "/",
  authenticate(["customer", "distributor", "store"]),
  getWishlistItems
);

module.exports = router;
