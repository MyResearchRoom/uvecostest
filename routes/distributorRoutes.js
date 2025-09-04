const express = require("express");
const { validate } = require("../middlewares/validations");
const {
  distributorValidationRules,
} = require("../validations/distributorValidation");
const authenticate = require("../middlewares/authMiddleware");
const {
  createDistributor,
  getDistributors,
  getDistributorById,
  updateDistributor,
  deleteDistributor,
  getDistributorAddress,
} = require("../controllers/distributorController");
const { upload } = require("../middlewares/upload");
const {
  validateFiles,
  validateFilesForUpdate,
} = require("../middlewares/fileValidation");

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "documents[]", maxCount: 5 },
    { name: "qrCode", maxCount: 1 },
  ]),
  validateFiles,
  distributorValidationRules,
  validate,
  authenticate(["companyUser"]),
  createDistributor
);

router.get("/", authenticate(["companyUser"]), getDistributors);

router.get("/:id", authenticate(["companyUser"]), getDistributorById);

router.put(
  "/:id",
  upload.fields([
    { name: "documents[]", maxCount: 5 },
    { name: "qrCode", maxCount: 1 },
  ]),
  validateFilesForUpdate,
  distributorValidationRules,
  validate,
  authenticate(["companyUser"]),
  updateDistributor
);

router.delete("/:id", authenticate(["companyUser"]), deleteDistributor);

router.get(
  "/address/orderaddress",
  authenticate(["distributor"]),
  getDistributorAddress
);

module.exports = router;
