const { body, check } = require("express-validator");

const productValidationRules = [
  body("productName")
    .notEmpty()
    .withMessage("Product name is required.")
    .trim()
    .escape(),

  body("productCategoryId")
    .notEmpty()
    .withMessage("Product category is required.")
    .isInt({ min: 1 })
    .withMessage("Product category must be a positive integer")
    .toInt(),

  body("productSubCategoryId")
    .notEmpty()
    .withMessage("Product sub category is required.")
    .isInt({ min: 1 })
    .withMessage("Product sub category must be a positive integer")
    .toInt(),

  body("description")
    .notEmpty()
    .withMessage("Description is required.")
    .trim()
    .escape(),

  body("specifications")
    .optional()
    .isArray()
    .withMessage("Specifications must be an array"),

  body("brandName")
    .notEmpty()
    .withMessage("Brand name is required.")
    .isString()
    .withMessage("Brand name must be a string")
    .trim()
    .escape(),

  body("warranty")
    .notEmpty()
    .withMessage("Warranty is required.")
    .isString()
    .withMessage("Warranty must be a string")
    .trim()
    .escape(),

  body("soldBy")
    .notEmpty()
    .withMessage("Sold by is required.")
    .isString()
    .withMessage("Sold by must be a string")
    .trim()
    .escape(),

  body("returnOption")
    .isInt({ min: 0 })
    .withMessage("Return option must be a positive integer")
    .toInt(),

  body("displayType")
    .notEmpty()
    .withMessage("Display type is required.")
    .isIn(["centralized", "private"])
    .withMessage("Display type must be either 'centralized' or 'private'")
    .trim()
    .escape(),

  body("deliveryMode")
    .notEmpty()
    .withMessage("Delivery mode is required.")
    .isArray()
    .withMessage("Delivery mode must be an array")
    .custom((value) => {
      const allowedModes = ["quick", "normal"];
      const isValid = value.every((mode) => allowedModes.includes(mode));
      if (!isValid) {
        throw new Error("Delivery mode can only contain 'quick' or 'normal'");
      }
      return true;
    }),

  body("keywords")
    .optional()
    .isArray()
    .withMessage("Keywords must be an array of strings")
    .custom((arr) => {
      if (!arr.every((item) => typeof item === "string")) {
        throw new Error("Each keyword must be a string");
      }
      return true;
    }),
];

const pricingValidationRules = [
  check("mrp")
    .notEmpty()
    .withMessage("Maximum retail price is required.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Maximum retail price must be a valid decimal value with up to 2 decimal places."
    )
    .toFloat(),

  check("originalPrice")
    .notEmpty()
    .withMessage("Selling price is required.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Selling price must be a valid decimal value with up to 2 decimal places."
    )
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Selling price must be greater than 0.")
    .custom((value, { req }) => {
      if (parseFloat(value) > parseFloat(req.body.mrp)) {
        throw new Error(
          "Selling price cannot be greater than maximum retail price."
        );
      }
      return true;
    }),

  check("discount")
    .notEmpty()
    .withMessage("Discount is required.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Discount must be a valid decimal value with up to 2 decimal places."
    )
    .toFloat()
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("Discount must be between 0 and 100."),

  check("gst")
    .notEmpty()
    .withMessage("GST is required.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "GST must be a valid decimal value with up to 2 decimal places."
    )
    .toFloat()
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("GST must be between 0 and 100."),

  check("handlingCharges")
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Handling charges must be a valid decimal number with up to 2 decimal places."
    )
    .toFloat()
    .custom((value) => value >= 0)
    .withMessage("Handling charges must be greater than or equal to 0."),

  check("otherCharges")
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Other charges must be a valid decimal number with up to 2 decimal places."
    )
    .toFloat()
    .custom((value) => value >= 0)
    .withMessage("Other charges must be greater than or equal to 0."),

  check("cod")
    .notEmpty()
    .withMessage("Cash on delivery option is required.")
    .isString()
    .trim()
    .escape()
    .isIn(["yes", "no"])
    .withMessage('Cash on delivery must be either "yes" or "no".'),

  check("shipping")
    .notEmpty()
    .withMessage("Shipping option is required.")
    .isString()
    .trim()
    .escape()
    .isIn(["free", "paid"])
    .withMessage('Shipping must be either "free" or "paid".'),

  check("shippingCharges")
    .if(check("shipping").equals("paid"))
    .notEmpty()
    .withMessage("Shipping charges are required when shipping is paid.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Shipping charges must be a valid decimal number.")
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Shipping charges must be greater than 0."),

  check("height")
    .if(check("shipping").equals("paid"))
    .notEmpty()
    .withMessage("Height is required when shipping is paid.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Height must be a valid decimal number.")
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Height must be greater than 0."),

  check("weight")
    .if(check("shipping").equals("paid"))
    .notEmpty()
    .withMessage("Weight is required when shipping is paid.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Weight must be a valid decimal number.")
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Weight must be greater than 0."),

  check("width")
    .if(check("shipping").equals("paid"))
    .notEmpty()
    .withMessage("Width is required when shipping is paid.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Width must be a valid decimal number.")
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Width must be greater than 0."),

  check("length")
    .if(check("shipping").equals("paid"))
    .notEmpty()
    .withMessage("Length is required when shipping is paid.")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Length must be a valid decimal number.")
    .toFloat()
    .custom((value) => value > 0)
    .withMessage("Length must be greater than 0."),
];

module.exports = {
  productValidationRules,
  pricingValidationRules,
};
