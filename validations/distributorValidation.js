const { body } = require("express-validator");

const distributorValidationRules = [
  body("name").notEmpty().withMessage("Name is required.").trim().escape(),

  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email.")
    .normalizeEmail(),

  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required.")
    .isMobilePhone()
    .withMessage("Invalid mobile number.")
    .trim(),

  body("city").notEmpty().withMessage("City is required.").trim().escape(),

  body("district")
    .notEmpty()
    .withMessage("District is required.")
    .trim()
    .escape(),

  body("state").notEmpty().withMessage("State is required.").trim().escape(),

  body("country")
    .notEmpty()
    .withMessage("Country is required.")
    .trim()
    .escape(),

  body("postalCodes")
    .notEmpty()
    .withMessage("Postal code is required.")
    .isArray({ min: 1 })
    .withMessage("Postal code must be an array."),

  body("region").notEmpty().withMessage("Region is required.").trim().escape(),

  body("productsCategory")
    .notEmpty()
    .withMessage("Products category is required.")
    .trim()
    .escape(),

  body("liscenseNumber")
    .notEmpty()
    .withMessage("License Number is required.") // (fixed typo "liscense")
    .trim()
    .escape(),

  body("taxIdentificationNumber")
    .notEmpty()
    .withMessage("Tax Identification Number is required.")
    .isAlphanumeric()
    .withMessage("Tax Identification Number must be alphanumeric.")
    .isLength({ min: 15, max: 15 })
    .withMessage("Tax identification number must be 15 characters long")
    .trim()
    .escape(),

  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required.")
    .trim()
    .escape(),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required.")
    .isNumeric()
    .withMessage("Invalid account number.")
    .trim(),

  body("ifscCode")
    .notEmpty()
    .withMessage("IFSC code is required.")
    .matches(/^[A-Za-z]{4}[0-9]{7}$/)
    .withMessage("Invalid IFSC code.")
    .trim()
    .escape(),

  body("branchName")
    .notEmpty()
    .withMessage("Branch name is required.")
    .trim()
    .escape(),

  body("upiId")
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)
    .withMessage("Invalid UPI ID.")
    .trim()
    .escape(),

  body("pinCode")
    .notEmpty()
    .withMessage("Pin code is required.")
    .isNumeric()
    .withMessage("Pin code must be numeric.")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code.")
    .trim(),

  body("street")
    .notEmpty()
    .withMessage("Street is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Street must be between 3 and 100 characters.")
    .trim()
    .escape(),

  body("baseAddress")
    .notEmpty()
    .withMessage("Base address is required.")
    .isLength({ min: 3, max: 100 })
    .withMessage("Base address must be between 3 and 100 characters.")
    .trim()
    .escape(),
];

module.exports = {
  distributorValidationRules,
};
