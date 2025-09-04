const { check } = require("express-validator");

const priceRuleValidationRules = [
  // Validate and sanitize name
  check("name")
    .notEmpty()
    .withMessage("Name is required.")
    .isString()
    .withMessage("Name must be a string.")
    .trim()
    .escape(),

  // Validate and sanitize products array
  check("products")
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one product."),

  // Validate and sanitize each product's ID
  check("products.*.id")
    .notEmpty()
    .withMessage("Product ID is required.")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer.")
    .toInt(),

  // Validate and sanitize each product's priceValue
  check("products.*.priceValue")
    .notEmpty()
    .withMessage("Price value is required.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Price value must be a valid decimal number with up to 2 decimal places."
    )
    .custom((value) => {
      const num = parseFloat(value);
      if (num < 0 || num > 100) {
        throw new Error("Percentage value must be between 0 and 100.");
      }
      return true;
    })
    .toFloat(),
];

module.exports = {
  priceRuleValidationRules,
};
