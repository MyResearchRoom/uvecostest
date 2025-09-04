const { check, param, body } = require("express-validator");

const offlineOrderValidationRules = [
  check("name")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  check("mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),

  check("email")
    .trim()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  check("address")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters long"),

  check("pinCode")
    .notEmpty()
    .withMessage("Pincode is required.")
    .isNumeric()
    .withMessage("Pincode must be numeric.")
    .trim(),

  check("state").notEmpty().withMessage("State is required.").trim().escape(),

  check("city").notEmpty().withMessage("City is required.").trim().escape(),

  check("district")
    .notEmpty()
    .withMessage("District is required.")
    .trim()
    .escape(),

  check("date")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid date format (Use YYYY-MM-DD)"),

  check("products")
    .isArray({ min: 1 })
    .withMessage("At least one product is required"),

  check("products.*.productId")
    .isInt({ gt: 0 })
    .withMessage("Product ID must be a positive integer"),

  check("products.*.quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  check("paidAmount")
    .isFloat({ gt: 0 })
    .withMessage("Paid amount must be greater than zero"),

  check("paymentMode")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Payment mode is required"),
];

const repayAmountValidationRules = [
  param("orderId")
    .toInt()
    .isInt({ gt: 0 })
    .withMessage("Order ID must be a positive integer"),

  body("rePayingAmount")
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage("Repaying amount must be greater than zero"),

  body("paymentMode")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Payment mode is required"),
];

module.exports = {
  offlineOrderValidationRules,
  repayAmountValidationRules,
};
