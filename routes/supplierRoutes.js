const express = require("express");
const router = express.Router();

const {
  createSupplier,
  getAllSuppliersWithIdAndName,
} = require("../controllers/supplierController");
const { getAllSuppliers } = require("../controllers/supplierController");
const { getSupplierById } = require("../controllers/supplierController");
const { updateSupplier } = require("../controllers/supplierController");
const { deleteSupplier } = require("../controllers/supplierController");
const authenticate = require("../middlewares/authMiddleware");

const { validate } = require("../middlewares/validations");
const {
  supplierValidationRules,
} = require("../validations/supplierValidation");

router.post(
  "/",
  supplierValidationRules,
  validate,
  authenticate(["companyUser"]),
  createSupplier
);

router.get("/", authenticate(["companyUser"]), getAllSuppliers);

router.get(
  "/list/names",
  authenticate(["store", "companyUser"]),
  getAllSuppliersWithIdAndName
);

router.get("/:id", authenticate(["companyUser"]), getSupplierById);

router.put(
  "/:id",
  supplierValidationRules,
  validate,
  authenticate(["companyUser"]),
  updateSupplier
);

router.delete("/:id", authenticate(["companyUser"]), deleteSupplier);

module.exports = router;
