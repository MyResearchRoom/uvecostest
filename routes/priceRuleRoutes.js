const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");
const {
  addPricerule,
  getPricerulesWithProductCount,
  getProductsByRuleName,
  deletePriceRule,
  assignedPricerulesToStore,
  assignedPricerulesToDistributor,
  editPriceRule,
  deleteProductFromPriceRule,
} = require("../controllers/priceRuleController");

const { validate } = require("../middlewares/validations");
const {
  priceRuleValidationRules,
} = require("../validations/priceruleValidation");

router.post(
  "/",
  priceRuleValidationRules,
  validate,
  authenticate(["companyUser"]),
  addPricerule
);

router.put(
  "/",
  priceRuleValidationRules,
  validate,
  authenticate(["companyUser"]),
  editPriceRule
);

router.post(
  "/delete",
  authenticate(["companyUser"]),
  deleteProductFromPriceRule
);

router.get("/", authenticate(["companyUser"]), getPricerulesWithProductCount);

router.post("/by-rule", authenticate(["companyUser"]), getProductsByRuleName);

router.post(
  "/delete-pricerule",
  authenticate(["companyUser"]),
  deletePriceRule
);

router.post(
  "/assigned-pricerule-to-store/:storeId",
  authenticate(["companyUser"]),
  assignedPricerulesToStore
);

router.post(
  "/assigned-pricerule-to-distributor/:distributorId",
  authenticate(["companyUser"]),
  assignedPricerulesToDistributor
);

module.exports = router;
