const { check, body } = require("express-validator");

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
    .trim()
    .escape()
    .isIn(["online", "cod"])
    .withMessage('paymentMethod must be either "online" or "cod".'),

  check("transactionId")
    .optional()
    .trim()
    .escape()
    .isString()
    .withMessage("transactionId must be a string."),
];

const orderReturnValidationRules = [
  body("status")
    .trim()
    .escape()
    .isString()
    .withMessage("Status must be a string")
    .isIn(["return"])
    .withMessage("Invalid status value"),

  // body("productId")
  //   .isInt({ min: 1 })
  //   .withMessage("Product ID is required"),

  body("reason").trim().escape().notEmpty().withMessage("Reason is required"),

  body("returnQuantity")
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),

  body("note").trim().escape().notEmpty().withMessage("Note is required"),
];

const cancelOrderValidationRules = [
  check("status")
    .trim()
    .escape()
    .isString()
    .withMessage("Status must be a string")
    .isIn(["cancelled"])
    .withMessage("Invalid status value"),

  check("productId")
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Product ID is required"),

  check("reason").trim().escape().notEmpty().withMessage("Reason is required"),
];

const changeOrderStatusValidationRules = [
  check("status")
    .trim()
    .escape()
    .isString()
    .withMessage("Status must be a string")
    .isIn(["accepted", "readyToDispatch", "inTransit", "completed", "rejected"])
    .withMessage("Invalid status value"),

  check("shipDate")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .trim()
    .notEmpty()
    .withMessage("Ship date is required")
    .isISO8601()
    .withMessage("Ship date must be a valid date (YYYY-MM-DD)"),

  check("trackId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Tracking ID is required"),

  check("note")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Note is required"),
    
  check("courierCompanyId")
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Courier company is required"),

  check("transactionId")
    .if((value, { req }) => req.body.status === "refunded")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Transaction ID is required"),

  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),

  check("returnQuantity")
    .if((value, { req }) => req.body.status === "return")
    .toInt()
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),

  check("pickUpDate")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),

  check("pickUpTime")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .notEmpty()
    .withMessage("Pickup time is required")
    .isISO8601()
    .withMessage("Pickup time must be a valid time (HH:MM)"),

  check("returnCourierCompanyId")
    .if((value, { req }) => req.body.status === "pickUp")
    .toInt()
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  check("returnTrackId")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Tracking ID is required"),

  check("courierAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),

  check("otherAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),

  check("handlingAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),

  check("comment")
    .if((value, { req }) => req.body.status === "refunded")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Comment is required"),
];

const cancelOrderStatusValidationRules = [
  check("status")
    .trim()
    .escape()
    .isString()
    .withMessage("Status must be a string")
    .isIn(["pending", "accepted", "rejected", "refunded", "completed"])
    .withMessage("Invalid status value"),

  check("transactionId")
    .if((value, { req }) => req.body.status === "refunded")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Transaction ID is required"),

  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),
];

const returnOrderStatusValidationRules = [
  check("status")
    .trim()
    .escape()
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
    .trim()
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),

  check("pickUpTime")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .notEmpty()
    .withMessage("Pickup time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Pickup time must be a valid time (HH:MM)"),

  check("courierCompanyId")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  check("trackId")
    .if((value, { req }) => req.body.status === "pickUp")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Tracking ID is required"),

  check("refundAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),

  check("courierAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),

  check("otherAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),

  check("handlingAmount")
    .if((value, { req }) => req.body.status === "refunded")
    .toFloat()
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),

  check("comment")
    .if((value, { req }) => req.body.status === "refunded")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Comment is required"),
];

const changeBigOrderStatusValidationRules = [
  check("status")
    .trim()
    .escape()
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

  check("reason")
    .trim()
    .escape()
    .if(
      (value, { req }) =>
        req.body.status === "cancelled" || req.body.status === "return"
    )
    .notEmpty()
    .withMessage("Reason is required"),

  check("shipDate")
    .trim()
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Ship date is required")
    .isISO8601()
    .withMessage("Ship date must be a valid date (YYYY-MM-DD)"),

  check("trackId")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Tracking ID is required"),

  check("note")
    .trim()
    .escape()
    .if(
      (value, { req }) =>
        req.body.status === "readyToDispatch" || req.body.status === "return"
    )
    .notEmpty()
    .withMessage("Note is required"),

  check("courierCompanyId")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "readyToDispatch")
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  check("transactionId")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Transaction ID is required"),

  check("refundAmount")
    .toFloat()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Refund amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Refund amount must be greater than zero."),

  check("returnQuantity")
    .toInt()
    .if((value, { req }) => req.body.status === "return")
    .notEmpty()
    .withMessage("Return quantity is required")
    .isInt({ gt: 0 })
    .withMessage("Return quantity must be greater than zero"),

  check("pickUpDate")
    .trim()
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup date is required")
    .isISO8601()
    .withMessage("Pickup date must be a valid date (YYYY-MM-DD)"),

  check("pickUpTime")
    .trim()
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Pickup time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Pickup time must be a valid time (HH:MM)"),

  check("returnCourierCompanyId")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Courier Company ID is required"),

  check("returnTrackId")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "pickUp")
    .notEmpty()
    .withMessage("Tracking ID is required"),

  check("courierAmount")
    .toFloat()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Courier amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Courier amount must be greater than zero."),

  check("otherAmount")
    .toFloat()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Other amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Other amount must be greater than zero."),

  check("handlingAmount")
    .toFloat()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Handling amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Handling amount must be greater than zero."),

  check("comment")
    .trim()
    .escape()
    .if((value, { req }) => req.body.status === "refunded")
    .notEmpty()
    .withMessage("Comment is required"),
];

module.exports = {
  placeOrderValidationRules,
  orderReturnValidationRules,
  cancelOrderValidationRules,
  changeOrderStatusValidationRules,
  cancelOrderStatusValidationRules,
  returnOrderStatusValidationRules,
  changeBigOrderStatusValidationRules,
};
