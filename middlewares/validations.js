const { check, validationResult, body, param } = require("express-validator");

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

const companyValidationRules = [
  body("companyName").notEmpty().withMessage("Company Name is required."),
  body("companyType")
    .optional()
    .isString()
    .withMessage("Company Type must be a string."),
  body("businessRegistrationNumber")
    .notEmpty()
    .withMessage("Business Registration Number is required."),
  body("licenseNumber").notEmpty().withMessage("License Number is required."),
  body("panNumber")
    .notEmpty()
    .withMessage("PAN Number is required.")
    .isLength({ min: 10, max: 10 })
    .withMessage("PAN Number must be 10 characters long."),
  body("gstNumber")
    .notEmpty()
    .withMessage("GST Number is required.")
    .isLength({ min: 15, max: 15 })
    .withMessage("GST Number must be 15 characters long."),
  body("tanNumber")
    .notEmpty()
    .withMessage("TAN Number is required.")
    .isLength({ min: 10, max: 10 })
    .withMessage("TAN Number must be 10 characters long."),
  body("cinNumber")
    .notEmpty()
    .withMessage("CIN Number is required.")
    .isLength({ min: 21, max: 21 })
    .withMessage("CIN Number must be 21 characters long."),
  body("dateOfEstablishment")
    .optional()
    .isDate()
    .withMessage("Date of Establishment must be a valid date."),
  body("industryType").notEmpty().withMessage("Industry Type is required."),
  body("websiteUrl")
    .optional()
    .isURL()
    .withMessage("Website URL must be a valid URL."),
  body("taxIdentificationNumber")
    .optional()
    .isString()
    .withMessage("Tax Identification Number must be a string."),
  body("productsCategory")
    .optional()
    .isString()
    .withMessage("Products Category must be a string."),

  // Contact Details
  body("primaryContactPersonName")
    .notEmpty()
    .withMessage("Primary Contact Person Name is required."),
  body("primaryEmail")
    .notEmpty()
    .withMessage("Primary Email is required.")
    .isEmail()
    .withMessage("Primary Email must be a valid email address."),
  body("primaryPhoneNumber")
    .notEmpty()
    .withMessage("Primary Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Primary Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Primary Phone Number must be 10 digits long."),
  body("primaryPinCode")
    .notEmpty()
    .withMessage("Primary pin code is required")
    .isNumeric()
    .withMessage("Primary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("primaryDistrict")
    .notEmpty()
    .withMessage("Primary district is required"),
  body("primaryState").notEmpty().withMessage("Primary state is required"),
  body("secondaryContactPersonName")
    .optional()
    .isString()
    .withMessage("Secondary Contact Person Name must be a string."),
  body("secondaryEmail")
    .optional()
    .isEmail()
    .withMessage("Secondary Email must be a valid email address."),
  body("secondaryPhoneNumber")
    .optional()
    .isMobilePhone("en-IN")
    .withMessage("Secondary Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Secondary Phone Number must be 10 digits long."),
  body("city").notEmpty().withMessage("City is required."),
  body("address").notEmpty().withMessage("Address is required."),
  body("companyAddress").notEmpty().withMessage("Company Address is required."),
  body("secondaryPinCode")
    .notEmpty()
    .withMessage("Secondary pin code is required")
    .isNumeric()
    .withMessage("Secondary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("secondaryDistrict")
    .notEmpty()
    .withMessage("Secondary district is required"),
  body("secondaryState").notEmpty().withMessage("Secondary state is required"),

  // Owner Details
  body("ownerFullName").notEmpty().withMessage("Owner Full Name is required."),
  body("ownerEmailId")
    .notEmpty()
    .withMessage("Owner Email ID is required.")
    .isEmail()
    .withMessage("Owner Email ID must be a valid email address."),
  body("ownerPhoneNumber")
    .notEmpty()
    .withMessage("Owner Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Owner Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Owner Phone Number must be 10 digits long."),
  body("ownerAddress")
    .notEmpty()
    .withMessage("Owner address is required.")
    .isString()
    .withMessage("Owner Address must be a string."),
  body("ownerPinCode")
    .notEmpty()
    .withMessage("Owner pin code is required")
    .isNumeric()
    .withMessage("Owner pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("ownerDistrict").notEmpty().withMessage("Owner district is required"),
  body("ownerState").notEmpty().withMessage("Owner state is required"),

  // Director Details
  body("directorFullName")
    .notEmpty()
    .withMessage("Director Full Name is required."),
  body("directorEmailId")
    .notEmpty()
    .withMessage("Director Email ID is required.")
    .isEmail()
    .withMessage("Director Email ID must be a valid email address."),
  body("directorPhoneNumber")
    .notEmpty()
    .withMessage("Director Phone Number is required.")
    .isMobilePhone("en-IN")
    .withMessage("Director Phone Number must be a valid phone number.")
    .isLength({ min: 10, max: 10 })
    .withMessage("Director Phone Number must be 10 digits long."),
  body("directorAddress")
    .notEmpty()
    .withMessage("Director address is required.")
    .isString()
    .withMessage("Director Address must be a string."),
  body("dinNumber")
    .optional()
    .isString()
    .withMessage("DIN Number must be a string."),
  body("directorPinCode")
    .notEmpty()
    .withMessage("Secondary pin code is required")
    .isNumeric()
    .withMessage("Secondary pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("directorDistrict")
    .notEmpty()
    .withMessage("Secondary district is required"),
  body("directorState").notEmpty().withMessage("Secondary state is required"),

  // Bank Details
  body("accountHolderName")
    .optional()
    .isString()
    .withMessage("Account Holder Name must be a string."),
  body("bankName")
    .optional()
    .isString()
    .withMessage("Bank Name must be a string."),
  body("accountNumber")
    .optional()
    .isNumeric()
    .withMessage("Account Number must be a number."),
  body("branchName")
    .optional()
    .isString()
    .withMessage("Branch Name must be a string."),
  body("ifscCode")
    .optional()
    .isString()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("IFSC Code must be a valid format."),
  body("accountType")
    .optional()
    .isString()
    .withMessage("Account Type must be a string."),
  body("upiId").optional().isString().withMessage("UPI ID must be a string."),
];

const verifyValidation = [
  check("mobileNumber").notEmpty().withMessage("Mobile number is required"),
  check("otp")
    .notEmpty()
    .withMessage("Otp is required")
    .isLength({ min: 4, max: 4 })
    .withMessage("Otp must be 4 digits long"),
];

const productValidationRules = [
  body("productName").notEmpty().withMessage("Product name is required."),
  body("productCategoryId")
    .notEmpty()
    .withMessage("Product category is required.")
    .isInt()
    .withMessage("Product category must be an integer"),
  body("productSubCategoryId")
    .notEmpty()
    .withMessage("Product sub category is required.")
    .isInt()
    .withMessage("Product sub category must be an integer"),
  body("description").notEmpty().withMessage("Description is required."),
  body("specifications")
    .optional()
    .isArray()
    .withMessage("Specifications must be an array"),
  body("brandName")
    .notEmpty()
    .withMessage("Brand name is required")
    .isString()
    .withMessage("Brand name must be a string"),
  body("warranty")
    .notEmpty()
    .withMessage("Warranty is required")
    .isString()
    .withMessage("Warranty must be a string"),
  body("soldBy")
    .notEmpty()
    .withMessage("Sold by is required")
    .isString()
    .withMessage("Sold by must be a string"),
  body("returnOption")
    .notEmpty()
    .withMessage("Return/Exchange is required")
    .isString()
    .withMessage("Return option must be a string"),
  body("displayType")
    .isIn(["centralized", "private"])
    .withMessage("Display type must be either 'centralized' or 'private'"),
  body("deliveryMode")
    .isArray()
    .withMessage("Delivery mode is required")
    .custom((value) => {
      const allowedModes = ["quick", "normal"];
      const isValid = value.every((mode) => allowedModes.includes(mode));
      if (!isValid) {
        throw new Error("Delivery mode can only contain 'quick' or 'normal'");
      }
      return true;
    }),
  body("keywords")
    .isArray()
    .withMessage("Keywords must be an array of strings"),
];

const pricingValidationRules = [
  check("mrp")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Maximum retail price must be a valid decimal value with up to 2 decimal places."
    ),
  check("originalPrice")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "Selling price must be a valid decimal value with up to 2 decimal places."
    )
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
    .withMessage("Discount is required")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("Discount must be between 0 and 100"),
  check("gst")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage(
      "GST must be a valid decimal value with up to 2 decimal places."
    )
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("GST must be between 0 and 100."),
  check("handlingCharges")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Handling charges must be a positive number")
    .custom((value) => value >= 0)
    .withMessage("Handling charges must be greater than or equal to 0"),
  check("otherCharges")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Other charges must be a positive number")
    .custom((value) => value >= 0)
    .withMessage("Other charges must be greater than or equal to 0"),
  check("cod")
    .isString()
    .isIn(["yes", "no"])
    .withMessage('Cash on delivery must be either "yes" or "no"'),
  check("shipping")
    .isString()
    .isIn(["free", "paid"])
    .withMessage('Shipping must be either "free" or "paid"'),
  check("shippingCharges")
    .if(check("shipping").equals("paid"))
    .isDecimal({ gt: 0 })
    .withMessage("Shipping charges must be a positive number"),
  check("height")
    .if(check("shipping").equals("paid"))
    .isDecimal({ gt: 0 })
    .withMessage("Height must be a decimal number greater than 0"),
  check("weight")
    .if(check("shipping").equals("paid"))
    .isDecimal({ gt: 0 })
    .withMessage("Weight must be a decimal number greater than 0"),
  check("width")
    .if(check("shipping").equals("paid"))
    .isDecimal({ gt: 0 })
    .withMessage("Width must be a decimal number greater than 0"),
  check("length")
    .if(check("shipping").equals("paid"))
    .isDecimal({ gt: 0 })
    .withMessage("Length must be a decimal number greater than 0"),
];

const supplierValidationRules = [
  check("name").notEmpty().withMessage("Name is required."),
  check("mobileNumber")
    .isNumeric()
    .withMessage("Mobile number must contain only numbers.")
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must be between 10 to 15 digits."),
  check("email").isEmail().withMessage("Email must be valid."),
  check("category")
    .isIn(["local", "international"])
    .withMessage("Category must be either 'local' or 'international'."),
  check("city").notEmpty().withMessage("City is required"),
  check("district").notEmpty().withMessage("District is required"),
  check("state").notEmpty().withMessage("State is required"),
  check("country").notEmpty().withMessage("Country is required"),
  check("pinCode")
    .notEmpty()
    .withMessage("Pin code is required")
    .isNumeric()
    .withMessage("Pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  check("street")
    .notEmpty()
    .withMessage("Street is required")
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Street must not exceed 100 characters"),
  check("baseAddress")
    .notEmpty()
    .withMessage("Base address is required")
    .isLength({ min: 3 })
    .withMessage("Base address must be at least 3 characters ")
    .isLength({ max: 100 })
    .withMessage("Base address must not exceed 100 characters "),
];

const distributorValidationRules = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone()
    .withMessage("Invalid mobile number"),
  body("city").notEmpty().withMessage("City is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("postalCodes")
    .notEmpty()
    .withMessage("Postal code is required")
    .isArray({ min: 1 })
    .withMessage("Postal code must be an array"),
  body("country").notEmpty().withMessage("Country is required"),
  body("region").notEmpty().withMessage("Region is required"),
  body("productsCategory")
    .notEmpty()
    .withMessage("Products category is required"),
  body("liscenseNumber").notEmpty().withMessage("Liscense Number is required"),
  body("taxIdentificationNumber")
    .notEmpty()
    .withMessage("Tax Identification Number is required")
    .isAlphanumeric()
    .withMessage("Invalid Tax Identification Number"),
  body("bankName").notEmpty().withMessage("Bank name is required"),
  body("accountNumber")
    .notEmpty()
    .withMessage("Account number is required")
    .isNumeric()
    .withMessage("Invalid account number"),
  body("ifscCode")
    .notEmpty()
    .withMessage("IFSC code is required")
    .matches(/^[A-Za-z]{4}[0-9]{7}$/)
    .withMessage("Invalid IFSC code"),
  body("branchName").notEmpty().withMessage("Branch name is required"),
  body("upiId")
    .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)
    .withMessage("Invalid UPI ID"),
  body("pinCode")
    .notEmpty()
    .withMessage("Pin code is required")
    .isNumeric()
    .withMessage("Pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("street")
    .notEmpty()
    .withMessage("Street is required")
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Street must not exceed 100 characters"),
  body("baseAddress")
    .notEmpty()
    .withMessage("Base address is required")
    .isLength({ min: 3 })
    .withMessage("Base address must be at least 3 characters ")
    .isLength({ max: 100 })
    .withMessage("Base address must not exceed 100 characters "),
];

const storeValidationRules = [
  // Personal Details
  body("name").notEmpty().withMessage("Store name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("mobileNumber")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be 10 digits"),
  body("storeType").notEmpty().withMessage("Store type is required"),
  body("industryType").notEmpty().withMessage("Industry type is required"),
  body("liscenseNumber").notEmpty().withMessage("Liscense number is required"),
  body("taxIdentificationNumber")
    .notEmpty()
    .withMessage("Tax identification number is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("district").notEmpty().withMessage("District is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("postalCodes")
    .isArray({ min: 1 })
    .withMessage("Postal codes must be an array with at least one value"),
  // Bank Details
  body("bankName").notEmpty().withMessage("Bank name is required"),
  body("accountNumber")
    .isNumeric()
    .withMessage("Account number must be numeric"),
  body("ifscCode")
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Invalid IFSC code format"),
  body("branchName").notEmpty().withMessage("Branch name is required"),
  body("upiCode").notEmpty().withMessage("UPI ID is required"),
  body("pinCode")
    .notEmpty()
    .withMessage("Pin code is required")
    .isNumeric()
    .withMessage("Pin code must be numeric")
    .matches(/^[0-9]{6}$/)
    .withMessage("Invalid pin code"),
  body("street")
    .notEmpty()
    .withMessage("Street is required")
    .isLength({ min: 3 })
    .withMessage("Street must be at least 3 characters")
    .isLength({ max: 100 })
    .withMessage("Street must not exceed 100 characters"),
  body("baseAddress")
    .notEmpty()
    .withMessage("Base address is required")
    .isLength({ min: 3 })
    .withMessage("Base address must be at least 3 characters ")
    .isLength({ max: 100 })
    .withMessage("Base address must not exceed 100 characters "),
];

const priceRuleValidationRules = [
  // Validate name
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),

  // Validate products
  check("products")
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one product"),

  // Validate each product in the array
  check("products.*.id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a positive integer"),
  check("products.*.priceValue")
    .notEmpty()
    .withMessage("Price value is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Price value must be a valid decimal number")
    .isInt({ min: 0, max: 100 })
    .withMessage("Percentage value must be between 0 and 100"),
];

const mainCategoryValidationRules = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Category name must be between 3 and 50 characters"),
  check("description")
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage("Description must be between 10 and 200 characters"),
];

const customerAddressValidationRules = [
  check("name").notEmpty().withMessage("Name is required"),
  check("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone()
    .withMessage("Invalid mobile number"),
  check("pinCode").notEmpty().withMessage("Pincode is required"),
  check("state").notEmpty().withMessage("State is required"),
  check("city").notEmpty().withMessage("City is required"),
  check("district").notEmpty().withMessage("District is required"),
  check("street").notEmpty().withMessage("Street is required"),
  check("baseAddress").notEmpty().withMessage("Base address is required"),
  // check("country").notEmpty().withMessage("Country is required"),
];

const offlineOrderValidationRules = [
  check("name")
    .trim()
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
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  check("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5 })
    .withMessage("Address must be at least 5 characters long"),
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
  check("paymentMode").notEmpty().withMessage("Payment mode is required"),
];

const repayAmountValidationRules = [
  param("orderId")
    .isInt({ gt: 0 })
    .withMessage("Order ID must be a positive integer"),
  body("rePayingAmount")
    .isFloat({ gt: 0 })
    .withMessage("Repaying amount must be greater than zero"),
  body("paymentMode").notEmpty().withMessage("Payment mode is required"),
];

const placeOrderValidationRules = [
  check("products")
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one item.")
    .bail()
    .custom((products) => {
      products.forEach((product, index) => {
        if (!product.productId || typeof product.productId !== "number") {
          throw new Error(
            `Product at index ${index} must have a valid productId.`
          );
        }
        if (
          !product.quantity ||
          typeof product.quantity !== "number" ||
          product.quantity <= 0
        ) {
          throw new Error(
            `Product at index ${index} must have a valid quantity greater than 0.`
          );
        }
      });
      return true;
    }),
  check("paymentMethod")
    .isIn(["online", "cod"])
    .withMessage('paymentMethod must be either "online" or "cod".'),
  check("transactionId")
    .optional()
    .isString()
    .withMessage("transactionId must be a string."),
];

const placeDistributorOrderValidationRules = [
  check("products")
    .isArray({ min: 1 })
    .withMessage("Products must be an array with at least one item.")
    .bail()
    .custom((products) => {
      products.forEach((product, index) => {
        if (!product.productId || typeof product.productId !== "number") {
          throw new Error(
            `Product at index ${index} must have a valid productId.`
          );
        }
        if (
          !product.quantity ||
          typeof product.quantity !== "number" ||
          product.quantity <= 0
        ) {
          throw new Error(
            `Product at index ${index} must have a valid quantity greater than 0.`
          );
        }
      });
      return true;
    }),
];

const orderReturnValidationRules = [
  body("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn(["return"])
    .withMessage("Invalid status value"),
  // body("productId").isInt({ min: 1 }).withMessage("Product ID is required"),
  body("reason").notEmpty().withMessage("Reason is required"),
  body("returnQuantity")
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),
  body("note").notEmpty().withMessage("Note is required"),
];

const cancelOrderValidationRules = [
  check("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn(["cancelled"])
    .withMessage("Invalid status value"),
  check("productId").isInt({ min: 1 }).withMessage("Product ID is required"),
  check("reason").notEmpty().withMessage("Reason is required"),
];

const changeOrderStatusValidationRules = [
  check("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn(["accepted", "readyToDispatch", "inTransit", "completed", "rejected"])
    .withMessage("Invalid status value"),

  // Validate fields required when status is 'readyToDispatch'
  check("shipDate")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Ship date is required")
    .isISO8601()
    .withMessage("Ship date must be a valid date (YYYY-MM-DD)"),
  check("trackId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Tracking ID is required"),
  check("note")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Note is required"),
  check("courierCompanyId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  // Validate fields required when status is 'refunded'
  check("transactionId")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Transaction ID is required"),
  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),

  check("returnQuantity")
    .if((value, { req }) => req.body.status === "return")
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),

  // Schedule pickup
  check("pickUpDate")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),
  check("pickUpTime")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup time is required")
    .isISO8601()
    .withMessage("Pickup time must be a valid time (HH:MM)"),
  check("returnCourierCompanyId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  check("returnTrackId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Tracking ID is required"),

  // Initiate refund for return order
  // check("returnRefundAmount")
  //   .if((value, { req }) => req.body.status === "refunded")
  //   .notEmpty()
  //   .withMessage("Refund amount is required")
  //   .isFloat({ gt: 0 })
  //   .withMessage("Refund amount must be greater than zero."),
  check("courierAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),
  check("otherAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),
  check("handlingAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),
  check("comment")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Comment is required"),
];

const cancelOrderStatusValidationRules = [
  check("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn(["pending", "accepted", "rejected", "refunded", "completed"])
    .withMessage("Invalid status value"),

  check("transactionId")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Transaction ID is required"),
  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),
];

const returnOrderStatusValidationRules = [
  check("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn([
      "pending",
      "accepted",
      "rejected",
      "pickUp",
      "received",
      "refunded",
      "completed",
    ])
    .withMessage("Invalid status value"),
  check("pickUpDate")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),
  check("pickUpTime")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup time is required")
    // .isISO8601()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Pickup time must be a valid time (HH:MM)"),
  check("courierCompanyId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Courier Company ID is required"),
  check("trackId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Tracking ID is required"),
  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),
  check("courierAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),
  check("otherAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),
  check("handlingAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),
  check("comment")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Comment is required"),
];

const intiateFundValidationRules = [
  check("refundAmount")
    .isInt({ gt: 0 })
    .withMessage("refundAmount must be a positive integer."),
  check("transactionId")
    .isString()
    .withMessage("transactionId must be a string."),
];

const addStockValidationRules = [
  body("orderType")
    .isIn(["import", "domestic"])
    .withMessage("orderType must be either 'import' or 'domestic'"),
  body("productId")
    .isInt({ min: 1 })
    .withMessage("productId must be a positive integer"),
  body("supplierId")
    .isInt({ min: 1 })
    .withMessage("supplierId must be a positive integer"),
  body("restockDate")
    .isISO8601()
    .withMessage("restockDate must be a valid date in YYYY-MM-DD format"),
  body("restockQuantity")
    .isInt({ min: 1 })
    .withMessage("restockQuantity must be a positive integer"),
  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("price must be a positive number"),
  body("gst")
    .isFloat({ min: 0.0 })
    .withMessage("GST must be a positive number"),
  body("transportCharges")
    .isFloat({ min: 0.0 })
    .withMessage("Transport charges must be a positive number"),
  body("handlingCharges")
    .isFloat({ min: 0.0 })
    .withMessage("Handling charges must be a positive number"),
  body("stockThresholdLevel")
    .isInt({ min: 0 })
    .withMessage("stockThresholdLevel must be a non-negative integer"),
];

const changeBigOrderStatusValidationRules = [
  check("status")
    .isString()
    .withMessage("Status must be a string")
    .isIn([
      "pending",
      "accepted",
      "refunded",
      "pickUp",
      "readyToDispatch",
      "inTransit",
      "completed",
      "cancelled",
      "rejected",
      "return",
    ])
    .withMessage("Invalid status value"),

  // Validate 'reason' if status is 'cancelled' or 'return'
  check("reason")
    .if(
      (value, { req }) =>
        req.body.status === "cancelled" || req.body.status === "return"
    )
    .notEmpty()
    .withMessage("Reason is required"),

  // Validate fields required when status is 'readyToDispatch'
  check("shipDate")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Ship date is required")
    .isISO8601()
    .withMessage("Ship date must be a valid date (YYYY-MM-DD)"),
  check("trackId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Tracking ID is required"),
  check("note")
    .if(
      (value, { req }) =>
        req.body.status === "readyToDispatch" || req.body.status === "return"
    )
    .notEmpty()
    .withMessage("Note is required"),
  check("courierCompanyId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  // Validate fields required when status is 'refunded'
  check("transactionId")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Transaction ID is required"),
  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),

  check("returnQuantity")
    .if((value, { req }) => req.body.status === "return")
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),

  // Schedule pickup
  check("pickUpDate")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),
  check("pickUpTime")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup time is required")
    .isISO8601()
    .withMessage("Pickup time must be a valid time (HH:MM)"),
  check("returnCourierCompanyId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Courier Company ID is required"),
  check("returnTrackId")
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Tracking ID is required"),

  // Initiate refund for return order
  // check("returnRefundAmount")
  //   .if((value, { req }) => req.body.status === "refunded")
  //   .notEmpty()
  //   .withMessage("Refund amount is required")
  //   .isFloat({ gt: 0 })
  //   .withMessage("Refund amount must be greater than zero."),
  check("courierAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),
  check("otherAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),
  check("handlingAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),
  check("comment")
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Comment is required"),
];

const validatePassword = (password) => {
  // Validation rules
  if (!password) {
    return "Please provide a password";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[@$!%*?&]/.test(password)) {
    return "Password must contain at least one special character (@, $, !, %, *, ?, &).";
  }
  if (/\s/.test(password)) {
    return "Password must not contain spaces.";
  }

  // If all conditions are met
  return true;
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

module.exports = {
  userValidationRules,
  verifyValidation,
  companyValidationRules,
  productValidationRules,
  pricingValidationRules,
  supplierValidationRules,
  distributorValidationRules,
  storeValidationRules,
  priceRuleValidationRules,
  mainCategoryValidationRules,
  customerAddressValidationRules,
  offlineOrderValidationRules,
  repayAmountValidationRules,
  placeOrderValidationRules,
  intiateFundValidationRules,
  orderReturnValidationRules,
  changeOrderStatusValidationRules,
  placeDistributorOrderValidationRules,
  addStockValidationRules,
  cancelOrderValidationRules,
  cancelOrderStatusValidationRules,
  returnOrderStatusValidationRules,
  changeBigOrderStatusValidationRules,
  validatePassword,
  validate,
};
