const { body } = require("express-validator");

const storeValidationRules = [
  // Personal Details
  body("name")
    .notEmpty()
    .withMessage("Store name is required.")
    .trim()
    .escape(),

  body("email")
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),

  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required.")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be 10 digits.")
    .trim(),

  body("storeType")
    .notEmpty()
    .withMessage("Store type is required.")
    .trim()
    .escape(),

  body("industryType")
    .notEmpty()
    .withMessage("Industry type is required.")
    .trim()
    .escape(),

  body("liscenseNumber")
    .notEmpty()
    .withMessage("License number is required.")
    .trim()
    .escape(),

  body("taxIdentificationNumber")
    .notEmpty()
    .withMessage("Tax identification number is required.")
    .isAlphanumeric()
    .withMessage("Tax identification number must be alphanumeric.")
    .isLength({ min: 15, max: 15 })
    .withMessage("Tax identification number must be 15 characters long")
    .trim()
    .escape(),

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

  // body("postalCodes")
  //   .isArray({ min: 1 })
  //   .withMessage("Postal codes must be an array with at least one value."),

  body("postalCodes").custom((value, { req }) => {
    if (req.body.storeType === "companyOwnStore") {
      return true;
    }
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error("Postal codes must be an array with at least one value.");
    }
    return true;
  }),

  // Bank Details
  body("bankName")
    .notEmpty()
    .withMessage("Bank name is required.")
    .trim()
    .escape(),

  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required.")
    .isNumeric()
    .withMessage("Account number must be numeric.")
    .trim(),

  body("ifscCode")
    .notEmpty()
    .withMessage("IFSC code is required.")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code format.")
    .trim()
    .escape(),

  body("branchName")
    .notEmpty()
    .withMessage("Branch name is required.")
    .trim()
    .escape(),

  body("upiCode")
    .notEmpty()
    .withMessage("UPI ID is required.")
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)
    .withMessage("Invalid UPI ID format.")
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
  storeValidationRules,
};
