const { body } = require("express-validator");

const companyValidationRules = [
  body("companyName")
    .notEmpty()
    .withMessage("Company Name is required.")
    .trim()
    .escape(),

  body("companyType")
    .optional()
    .isString()
    .withMessage("Company Type must be a string.")
    .trim()
    .escape(),

  body("businessRegistrationNumber")
    .notEmpty()
    .withMessage("Business Registration Number is required.")
    .trim()
    .escape(),

  body("licenseNumber")
    .notEmpty()
    .withMessage("License Number is required.")
    .trim()
    .escape(),

  body("panNumber")
    .notEmpty()
    .withMessage("PAN Number is required.")
    .isLength({ min: 10, max: 10 })
    .withMessage("PAN Number must be 10 characters long.")
    .trim()
    .escape(),

  body("gstNumber")
    .notEmpty()
    .withMessage("GST Number is required.")
    .isLength({ min: 15, max: 15 })
    .withMessage("GST Number must be 15 characters long.")
    .trim()
    .escape(),

  body("tanNumber")
    .notEmpty()
    .withMessage("TAN Number is required.")
    .isLength({ min: 10, max: 10 })
    .withMessage("TAN Number must be 10 characters long.")
    .trim()
    .escape(),

  body("cinNumber")
    .notEmpty()
    .withMessage("CIN Number is required.")
    .isLength({ min: 21, max: 21 })
    .withMessage("CIN Number must be 21 characters long.")
    .trim()
    .escape(),

  body("dateOfEstablishment")
    .optional()
    .isDate()
    .withMessage("Date of Establishment must be a valid date."),

  body("industryType")
    .notEmpty()
    .withMessage("Industry Type is required.")
    .trim()
    .escape(),

  body("websiteUrl")
    .optional()
    .isURL()
    .withMessage("Website URL must be a valid URL.")
    .trim(),

  body("taxIdentificationNumber")
    .optional()
    .isString()
    .withMessage("Tax Identification Number must be a string.")
    .isAlphanumeric()
    .withMessage("Tax Identification Number must be alphanumeric")
    .isLength({ min: 15, max: 15 })
    .withMessage("Tax identification number must be 15 characters long")
    .trim()
    .escape(),

  body("productsCategory")
    .optional()
    .isString()
    .withMessage("Products Category must be a string.")
    .trim()
    .escape(),

  // Contact Details
  body("primaryContactPersonName")
    .notEmpty()
    .withMessage("Primary Contact Person Name is required.")
    .trim()
    .escape(),

  body("primaryEmail")
    .notEmpty()
    .withMessage("Primary Email is required.")
    .isEmail()
    .withMessage("Primary Email must be a valid email address.")
    .normalizeEmail(),

  body("primaryPhoneNumber")
    .notEmpty()
    .withMessage("Primary Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Primary Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Primary Phone Number must be 10 digits long.")
    .trim(),

  body("primaryPinCode")
    .notEmpty()
    .withMessage("Primary pin code is required")
    .isNumeric()
    .withMessage("Primary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code")
    .trim(),

  body("primaryDistrict")
    .notEmpty()
    .withMessage("Primary district is required.")
    .trim()
    .escape(),

  body("primaryState")
    .notEmpty()
    .withMessage("Primary state is required.")
    .trim()
    .escape(),

  body("secondaryContactPersonName")
    .optional()
    .isString()
    .withMessage("Secondary Contact Person Name must be a string.")
    .trim()
    .escape(),

  body("secondaryEmail")
    .optional()
    .isEmail()
    .withMessage("Secondary Email must be a valid email address.")
    .normalizeEmail(),

  body("secondaryPhoneNumber")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Secondary Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Secondary Phone Number must be 10 digits long.")
    .trim(),

  body("city").notEmpty().withMessage("City is required.").trim().escape(),

  body("address")
    .notEmpty()
    .withMessage("Address is required.")
    .trim()
    .escape(),

  body("companyAddress")
    .notEmpty()
    .withMessage("Company Address is required.")
    .trim()
    .escape(),

  body("secondaryPinCode")
    .notEmpty()
    .withMessage("Secondary pin code is required")
    .isNumeric()
    .withMessage("Secondary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code")
    .trim(),

  body("secondaryDistrict")
    .notEmpty()
    .withMessage("Secondary district is required.")
    .trim()
    .escape(),

  body("secondaryState")
    .notEmpty()
    .withMessage("Secondary state is required.")
    .trim()
    .escape(),

  // Owner Details
  body("ownerFullName")
    .notEmpty()
    .withMessage("Owner Full Name is required.")
    .trim()
    .escape(),

  body("ownerEmailId")
    .notEmpty()
    .withMessage("Owner Email ID is required.")
    .isEmail()
    .withMessage("Owner Email ID must be a valid email address.")
    .normalizeEmail(),

  body("ownerPhoneNumber")
    .notEmpty()
    .withMessage("Owner Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Owner Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Owner Phone Number must be 10 digits long.")
    .trim(),

  body("ownerAddress")
    .notEmpty()
    .withMessage("Owner address is required.")
    .isString()
    .withMessage("Owner Address must be a string.")
    .trim()
    .escape(),

  body("ownerPinCode")
    .notEmpty()
    .withMessage("Owner pin code is required")
    .isNumeric()
    .withMessage("Owner pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code")
    .trim(),

  body("ownerDistrict")
    .notEmpty()
    .withMessage("Owner district is required.")
    .trim()
    .escape(),

  body("ownerState")
    .notEmpty()
    .withMessage("Owner state is required.")
    .trim()
    .escape(),

  // Director Details
  body("directorFullName")
    .notEmpty()
    .withMessage("Director Full Name is required.")
    .trim()
    .escape(),

  body("directorEmailId")
    .notEmpty()
    .withMessage("Director Email ID is required.")
    .isEmail()
    .withMessage("Director Email ID must be a valid email address.")
    .normalizeEmail(),

  body("directorPhoneNumber")
    .notEmpty()
    .withMessage("Director Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Director Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Director Phone Number must be 10 digits long.")
    .trim(),

  body("directorAddress")
    .notEmpty()
    .withMessage("Director address is required.")
    .isString()
    .withMessage("Director Address must be a string.")
    .trim()
    .escape(),

  body("dinNumber")
    .optional()
    .isString()
    .withMessage("DIN Number must be a string.")
    .trim()
    .escape(),

  body("directorPinCode")
    .notEmpty()
    .withMessage("Secondary pin code is required")
    .isNumeric()
    .withMessage("Secondary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code")
    .trim(),

  body("directorDistrict")
    .notEmpty()
    .withMessage("Secondary district is required.")
    .trim()
    .escape(),

  body("directorState")
    .notEmpty()
    .withMessage("Secondary state is required.")
    .trim()
    .escape(),

  // Bank Details
  body("accountHolderName")
    .optional()
    .isString()
    .withMessage("Account Holder Name must be a string.")
    .trim()
    .escape(),

  body("bankName")
    .optional()
    .isString()
    .withMessage("Bank Name must be a string.")
    .trim()
    .escape(),

  body("accountNumber")
    .optional()
    .isNumeric()
    .withMessage("Account Number must be a number.")
    .trim(),

  body("branchName")
    .optional()
    .isString()
    .withMessage("Branch Name must be a string.")
    .trim()
    .escape(),

  body("ifscCode")
    .optional()
    .isString()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("IFSC Code must be a valid format.")
    .trim()
    .escape(),

  body("accountType")
    .optional()
    .isString()
    .withMessage("Account Type must be a string.")
    .trim()
    .escape(),

  body("upiId")
    .optional()
    .isString()
    .withMessage("UPI ID must be a string.")
    .trim()
    .escape(),
];

module.exports = {
  companyValidationRules,
};
