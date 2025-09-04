const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/upload");
const {
  addStockHistory,
  getStockHistoryProduct,
  getStockHistoryByProductId,
  getStockHistoryDocument,
  getListOfPreviouslyAddedStock,
} = require("../controllers/stockHistoryController");
const { validateFilesForUpdate } = require("../middlewares/fileValidation");
const { validate } = require("../middlewares/validations");
const {
  addStockValidationRules,
} = require("../validations/addStockValidation");

router.post(
  "/",
  upload.array("documents[]"),
  validateFilesForUpdate,
  addStockValidationRules,
  validate,
  authenticate(["store", "companyUser"]),
  addStockHistory
);

router.get("/", authenticate(["store", "companyUser"]), getStockHistoryProduct);

router.get(
  "/:productId/product",
  authenticate(["store", "companyUser"]),
  getStockHistoryByProductId
);

router.get(
  "/:documentId/document",
  authenticate(["store", "companyUser"]),
  getStockHistoryDocument
);

router.get(
  "/:productId/last-three",
  authenticate(["store", "companyUser"]),
  getListOfPreviouslyAddedStock
);

module.exports = router;
