const { check } = require("express-validator");

const mainCategoryValidationRules = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required.")
    .isLength({ min: 3, max: 50 })
    .withMessage("Category name must be between 3 and 50 characters.")
    .trim()
    .escape(),

  check("description")
    .optional()
    .isLength({ min: 10, max: 200 })
    .withMessage("Description must be between 10 and 200 characters.")
    .trim()
    .escape(),
];

module.exports = {
  mainCategoryValidationRules,
};
