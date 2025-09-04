const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");
const {
  reviewProduct,
  getReviews,
} = require("../controllers/reviewController");

router.post(
  "/:orderId",
  authenticate(["customer", "store", "distributor"]),
  reviewProduct
);

router.get("/:productId/reviews", getReviews);

module.exports = router;
