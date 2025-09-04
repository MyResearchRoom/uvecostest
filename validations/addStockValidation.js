const { body } = require("express-validator");

const addStockValidationRules = [
  body("orderType")
    .trim()
    .escape()
    .isIn(["import", "domestic"])
    .withMessage("orderType must be either 'import' or 'domestic'"),

  body("productId")
    .toInt()
    .isInt({ min: 1 })
    .withMessage("productId must be a positive integer"),

  body("supplierId")
    .toInt()
    .isInt({ min: 1 })
    .withMessage("supplierId must be a positive integer"),

  body("restockDate")
    .trim()
    .isISO8601()
    .withMessage("restockDate must be a valid date in YYYY-MM-DD format"),

  body("restockQuantity")
    .toInt()
    .isInt({ min: 1 })
    .withMessage("restockQuantity must be a positive integer"),

  body("price")
    .toFloat()
    .isFloat({ min: 0.01 })
    .withMessage("price must be a positive number"),

  body("gst")
    .toFloat()
    .isFloat({ min: 0.0 })
    .withMessage("GST must be a positive number"),

  body("transportCharges")
    .toFloat()
    .isFloat({ min: 0.0 })
    .withMessage("Transport charges must be a positive number"),

  body("handlingCharges")
    .toFloat()
    .isFloat({ min: 0.0 })
    .withMessage("Handling charges must be a positive number"),

  body("stockThresholdLevel")
    .toInt()
    .isInt({ min: 0 })
    .withMessage("stockThresholdLevel must be a non-negative integer"),
];

module.exports = {
  addStockValidationRules,
};
