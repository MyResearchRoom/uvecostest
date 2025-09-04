const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { upload } = require("../middlewares/upload");
const authenticate = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validations");
const { storeValidationRules } = require("../validations/storeValidation");
const {
  validateFiles,
  validateFilesForUpdate,
} = require("../middlewares/fileValidation");

// Routes
// Create a new store
router.post(
  "/",
  upload.fields([
    { name: "businessLiscense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "qrCode", maxCount: 1 },
  ]),
  validateFiles,
  storeValidationRules,
  validate,
  authenticate(["companyUser"]),
  storeController.createStore
);

router.get("/", authenticate(["companyUser"]), storeController.getStores);

// Get a single store by ID
router.get("/:id", authenticate(["companyUser"]), storeController.getStoreById);

// Update a store
router.put(
  "/:id",
  upload.fields([
    { name: "businessLiscense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "qrCode", maxCount: 1 },
  ]),
  validateFilesForUpdate,
  storeValidationRules,
  validate,
  authenticate(["companyUser"]),
  storeController.updateStore
);

// Delete a store
router.delete(
  "/:id",
  authenticate(["companyUser"]),
  storeController.deleteStore
);

router.get(
  "/:storeId/customer",
  authenticate(["companyUser"]),
  storeController.getCustomers
);

router.get(
  "/:storeId/details",
  authenticate(["companyUser"]),
  storeController.getStoreDetails
);

module.exports = router;
