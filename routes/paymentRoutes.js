const { Router } = require("express");
const {
  getCompanyListWithPaymentData,
  getStoreListWithPaymentData,
  getPlatformToCompanyTransactions,
  getCompanyToStoreTransactions,
  getstoreTransactions,
  getPlatformPaymentStats,
  getStorePaymentStats,
  getCompanyPaymentStats,
  payToCompany,
} = require("../controllers/paymentController");
const authenticate = require("../middlewares/authMiddleware");

const router = Router();

router.get(
  "/companies",
  authenticate(["platformUser"]),
  getCompanyListWithPaymentData
);

router.get(
  "/stores",
  authenticate(["companyUser"]),
  getStoreListWithPaymentData
);

router.get(
  "/companies/transactions/:companyId",
  authenticate(["platformUser"]),
  getPlatformToCompanyTransactions
);

router.get(
  "/stores/transactions/:storeId",
  authenticate(["companyUser"]),
  getCompanyToStoreTransactions
);

router.get(
  "/store/transactions",
  authenticate(["store"]),
  getstoreTransactions
);

router.get(
  "/platform/stats",
  authenticate(["platformUser"]),
  getPlatformPaymentStats
);

router.get(
  "/company/stats",
  authenticate(["companyUser"]),
  getCompanyPaymentStats
);

router.get("/store/stats", authenticate(["store"]), getStorePaymentStats);

router.post("/pay/company", authenticate(["platformUser"]), payToCompany);

module.exports = router;
