const express = require("express");
const {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  selectAddress,
} = require("../controllers/customerAddressController");
const { validate } = require("../middlewares/validations");
const {
  customerAddressValidationRules,
} = require("../validations/customerAddressValidation");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/",
  customerAddressValidationRules,
  validate,
  authenticate(["customer", "distributor", "store"]),
  createAddress
);

router.get(
  "/",
  authenticate(["customer", "distributor", "store"]),
  getAddresses
);

router.get("/:id", getAddressById);

router.put(
  "/:id",
  customerAddressValidationRules,
  validate,
  authenticate(["customer", "distributor", "store"]),
  updateAddress
);

router.delete(
  "/:id",
  authenticate(["customer", "distributor", "store"]),
  deleteAddress
);

router.post(
  "/select/address",
  authenticate(["customer", "distributor", "store"]),
  selectAddress
);

module.exports = router;
