const { check } = require("express-validator");

const supplierValidationRules = [
  check("name").notEmpty().withMessage("Name is required.").trim().escape(),

  check("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required.")
    .isNumeric()
    .withMessage("Mobile number must contain only numbers.")
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 to 15 digits.")
    .trim(),

  check("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Email must be valid.")
    .normalizeEmail(),

  check("category")
    .notEmpty()
    .withMessage("Category is required.")
    .isString()
    .trim()
    .escape()
    .isIn(["local", "international"])
    .withMessage("Category must be either 'local' or 'international'."),

  check("city").notEmpty().withMessage("City is required.").trim().escape(),

  check("district")
    .notEmpty()
    .withMessage("District is required.")
    .trim()
    .escape(),

  check("state").notEmpty().withMessage("State is required.").trim().escape(),

  check("country")
    .notEmpty()
    .withMessage("Country is required.")
    .trim()
    .escape(),

  check("pinCode")
    .notEmpty()
    .withMessage("Pin code is required.")
    .isNumeric()
    .withMessage("Pin code must be numeric.")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code. Pin code must be exactly 6 digits.")
    .trim(),

  check("street")
    .notEmpty()
    .withMessage("Street is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Street must be between 3 and 100 characters.")
    .trim()
    .escape(),

  check("baseAddress")
    .notEmpty()
    .withMessage("Base address is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Base address must be between 3 and 100 characters.")
    .trim()
    .escape(),
];

module.exports = {
  supplierValidationRules,
};
