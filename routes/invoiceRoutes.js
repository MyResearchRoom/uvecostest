const express = require("express");
const {
  getInvoice,
  getSingleInvoice,
  getBigInvoice,
  getOfflineInvoice,
  getReturnSingleInvoice,
  getAfterBillGenerateInvoice,
} = require("../controllers/invoiceController");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

router.get("/:orderId", authenticate(["store", "orderManager"]), getInvoice);

router.get(
  "/:orderId/single",
  authenticate(["store", "distributor", "customer"]),
  getSingleInvoice
);

router.get(
  "/:orderId/single",
  authenticate(["store", "distributor", "customer"]),
  getSingleInvoice
);

router.get(
  "/return/:orderId/single",
  authenticate(["customer"]),
  getReturnSingleInvoice
);

router.get(
  "/big/:orderId",
  authenticate(["store", "orderManager"]),
  getBigInvoice
);

router.get(
  "/offline/:orderId",
  authenticate(["store", "orderManager"]),
  getOfflineInvoice
);

router.get(
  "/offline/:orderId/after-bill",
  authenticate(["store", "orderManager"]),
  getAfterBillGenerateInvoice
);

module.exports = router;
