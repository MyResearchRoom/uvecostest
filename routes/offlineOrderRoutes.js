const express = require("express");
const router = express.Router();
const {
  createOfflineOrder,
  repayAmount,
  getOrders,
  getOrderDetails,
} = require("../controllers/offlineOrderController");
const authenticate = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validations");
const {
  offlineOrderValidationRules,
  repayAmountValidationRules,
} = require("../validations/offlineOrderValidation");

router.post(
  "/",
  offlineOrderValidationRules,
  validate,
  authenticate(["store", "orderManager"]),
  createOfflineOrder
);

router.get("/", authenticate(["store", "orderManager"]), getOrders);

router.get(
  "/:orderId",
  authenticate(["store", "orderManager"]),
  getOrderDetails
);

router.post(
  "/repay/:orderId",
  repayAmountValidationRules,
  validate,
  authenticate(["store", "orderManager"]),
  repayAmount
);

module.exports = router;
