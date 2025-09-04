const { check } = require("express-validator");

const userValidationRules = [
  check("name").notEmpty().withMessage("Name is required").trim().escape(),

  check("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required.")
    .isNumeric()
    .withMessage("Mobile number must contain only numbers.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be 10 digits long.")
    .trim(),
];

const verifyValidation = [
  check("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .trim()
    .escape(),

  check("otp")
    .notEmpty()
    .withMessage("Otp is required")
    .isLength({ min: 4, max: 4 })
    .withMessage("Otp must be 4 digits long")
    .trim()
    .escape(),
];

module.exports = {
  userValidationRules,
  verifyValidation,
};
