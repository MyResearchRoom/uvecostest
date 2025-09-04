const { check } = require("express-validator");

const customerAddressValidationRules = [
  check("name").notEmpty().withMessage("Name is required.").trim().escape(),

  check("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required.")
    .isMobilePhone()
    .withMessage("Invalid mobile number.")
    .trim(),

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

  check("street")
    .notEmpty()
    .withMessage("Street is required.")
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters long.")
    .trim()
    .escape(),

  check("baseAddress")
    .notEmpty()
    .withMessage("Base address is required.")
    .isLength({ min: 3 })
    .withMessage("Base address must be at least 3 characters long.")
    .trim()
    .escape(),

  // If you want to include country again:
  // check("country")
  //   .notEmpty()
  //   .withMessage("Country is required.")
  //   .trim()
  //   .escape(),
];

module.exports = {
  customerAddressValidationRules,
};
