const { Op } = require("sequelize");
const {
  ProductCategory,
  ProductSubCategory,
  MainCategory,
  sequelize,
  Company,
} = require("../models");
const logger = require("../utils/logger");
const { imageFormats } = require("../utils/constants");

// Reject status true means category approved, & false means category rejected
const getStatus = (approved, pending, rejected) => {
  let total =
    parseInt(approved, 10) + parseInt(pending, 10) + parseInt(rejected, 10);
  return total === approved
    ? "approved"
    : total === pending
    ? "pending"
    : total === rejected
    ? "rejected"
    : total === 0
    ? "-"
    : "Partially approved";
};

exports.addProdctCategory = async (req, res, next) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product category name" });
  }

  if (!description || description.length < 3 || description.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category description" });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide category image" });
  }

  if (!imageFormats.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only image is allowed",
    });
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Image size should not exceed 5MB",
    });
  }

  try {
    const isExists = await ProductCategory.findOne({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });
    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Product category already exists" });
    }

    const productCategory = await ProductCategory.create({
      name,
      description,
      image: req.file.buffer,
      contentType: req.file.mimetype,
      companyId: req.user.companyId,
      requestedAt: new Date(),
    });

    logger.info("A new product category has been created", {
      actionBy: req.user.id,
      productCategoryId: productCategory.id,
    });

    res.status(201).json({
      success: true,
      message: "Product category created successfully",
      data: {
        id: productCategory.id,
        name: productCategory.name,
        description: productCategory.description || null,
        rejectStatus: productCategory.rejectStatus || null,
        image: `data:${
          productCategory.contentType
        };base64,${productCategory.image.toString("base64")}`,
      },
    });
  } catch (error) {
    logger.error("Error while creating product category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed too add category" });
  }
};

exports.getAllCategoriesWithPagination = async (req, res, next) => {
  let { page = 1, limit = 10, searchTerm = "" } = req.query;
  const whereClause = { companyId: req.user.companyId };

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const offset = (page - 1) * limit;

  if (typeof searchTerm === "string" && searchTerm.trim() !== "") {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
      { "$mainCategory.name$": { [Op.like]: `%${searchTerm}%` } },
    ];
  }

  try {
    const { rows: categories, count } = await ProductCategory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MainCategory,
          as: "mainCategory",
          attributes: ["name"],
        },
      ],
      limit,
      offset,
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      rejectStatus: category.rejectStatus,
      rejectNote: category.rejectNote,
      mainCategory: category.mainCategory?.name,
      requestDate: category.requestedAt?.toLocaleDateString(),
      approveDate: category.approvedAt?.toLocaleDateString(),
      image: `data:${category.contentType};base64,${category.image.toString(
        "base64"
      )}`,
    }));

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: {
        data,
        pagination: {
          total: count,
          currentPage: page,
          totalPages,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error while feching product categories", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

exports.getAllCategories = async (req, res, next) => {
  let companyId = req.query.companyId;
  const whereClause = {};
  const includes = [];

  if (req.url === "/") {
    whereClause.rejectStatus = true;
    companyId = req.user.companyId;
  } else if (req.url.startsWith("/approved/categories")) {
    whereClause.rejectStatus = true;
    companyId = req.params.companyId;
    includes.push({
      model: MainCategory,
      as: "mainCategory",
      attributes: ["name", "id"],
    });
  } else if (req.url.startsWith("/requested/categories")) {
    whereClause.rejectStatus = null;
    companyId = req.params.companyId;
  }

  whereClause.companyId = companyId;

  if (!companyId) {
    return res
      .status(400)
      .json({ success: false, message: "Company ID is required" });
  }

  try {
    const categories = await ProductCategory.findAll({
      where: whereClause,
      include: includes,
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      rejectStatus: category.rejectStatus,
      rejectNote: category.rejectNote,
      mainCategory: category.mainCategory?.name,
      mainCategoryId: category.mainCategory?.id,
      requestDate: category.requestedAt?.toLocaleDateString(),
      approveDate: category.approvedAt?.toLocaleDateString(),
      image: `data:${category.contentType};base64,${category.image.toString(
        "base64"
      )}`,
    }));
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data,
    });
  } catch (error) {
    logger.error("Error while feching product categories", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get categories",
    });
  }
};

exports.updateProductCategory = async (req, res, next) => {
  const { name, description } = req.body;
  const id = req.params.id;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product category name" });
  }

  if (
    !description ||
    description.trim().length < 3 ||
    description.trim().length > 50
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category description" });
  }

  try {
    const isExists = await ProductCategory.findOne({
      where: {
        name,
        companyId: req.user.companyId,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (isExists) {
      return res.status(400).json({
        success: false,
        message: "Category with name '" + name + "' already exists",
      });
    }

    const updationData = { name };
    if (req.file) {
      if (!imageFormats.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only image is allowed",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size should not exceed 5MB",
        });
      }
      updationData.image = req.file.buffer;
      updationData.contentType = req.file.mimetype;
      updationData.rejectStatus = null;
      updationData.rejectNote = null;
      updationData.approvedAt = null;
      updationData.requestedAt = new Date();
    }

    const productCategory = await ProductCategory.update(updationData, {
      where: { id },
    });

    logger.info("A product category has been updated", {
      actionBy: req.user.id,
      productCategoryId: productCategory.id,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: {
        id: productCategory.id,
        name: productCategory.name,
        image: `data:${req.file?.mimetype};base64,${req.file?.buffer?.toString(
          "base64"
        )}`,
      },
    });
  } catch (error) {
    logger.error("Error while updating product category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update category" });
  }
};

exports.deleteProductCategory = async (req, res, next) => {
  const id = req.params.id;
  try {
    const productCategory = await ProductCategory.destroy({ where: { id } });
    if (!productCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    logger.info("A product category has been deleted", {
      actionBy: req.user.id,
      productCategoryId: productCategory.id,
    });
    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting product category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete category" });
  }
};

exports.addProdctSubCategory = async (req, res, next) => {
  const { name, productCategoryId } = req.body;
  if (
    !name ||
    name.trim() === "" ||
    name.trim().length < 3 ||
    name.trim().length > 50
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product category name" });
  }

  try {
    const isExists = await ProductSubCategory.findOne({
      where: { name, productCategoryId },
    });
    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Sub category already exists " });
    }
    const productSubCategory = await ProductSubCategory.create({
      name,
      productCategoryId,
    });

    res.status(201).json({
      success: true,
      message: "Sub category created successfully",
      data: productSubCategory,
    });
  } catch (error) {
    logger.error("Error while adding product sub category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to add sub category" });
  }
};

exports.getAllSubCategories = async (req, res, next) => {
  const { id: productCategoryId } = req.params;
  try {
    const productSubCategories = await ProductSubCategory.findAll({
      where: { productCategoryId },
    });
    res.status(200).json({ success: true, data: productSubCategories });
  } catch (error) {
    logger.error("Error while getting all product sub categories", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get sub categories" });
  }
};

exports.updateProductSubCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (
    !name ||
    name.trim() === "" ||
    name.trim().length < 3 ||
    name.trim().length > 50
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product sub category name" });
  }

  try {
    const productSubCategory = await ProductSubCategory.findOne({
      where: { id },
    });

    if (!productSubCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Sub category not found " });
    }

    const isExists = await ProductSubCategory.findOne({
      where: {
        name,
        productCategoryId: productSubCategory.productCategoryId,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (isExists) {
      return res
        .status(500)
        .json({ success: false, message: "Sub category already exists" });
    }

    productSubCategory.name = name;
    await productSubCategory.save();

    logger.info("A product sub category has been updated", {
      actionBy: req.user.id,
      productSubCategoryId: productSubCategory.id,
    });

    res.status(200).json({
      success: true,
      message: "Sub category updated successfully",
      productSubCategory,
    });
  } catch (error) {
    logger.error("Error while updating product sub category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update sub category" });
  }
};

exports.deleteProductSubCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const productCategory = await ProductSubCategory.destroy({ where: { id } });
    logger.info("A product sub category has been deleted", {
      actionBy: req.user.id,
      productSubCategoryId: id,
    });
    res.status(200).json({
      success: true,
      message: "Sub category deleted successfully",
      productCategory,
    });
  } catch (error) {
    logger.error("Error while deleting product sub category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete sub category" });
  }
};

exports.getCompanyWithProductCategoryCount = async (req, res, next) => {
  const { companyId, page = 1, pageSize = 10 } = req.query;

  const whereClause = {};
  if (!isNaN(companyId)) {
    whereClause.id = companyId;
  }
  const offset = (page - 1) * pageSize;
  const limit = parseInt(pageSize);

  try {
    const { count, rows: data } = await Company.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "companyName",
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM product_categories 
              WHERE product_categories.companyId = Company.id 
              AND product_categories.rejectStatus = true)`
          ),
          "approvedCategoryCount",
        ],
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM product_categories 
              WHERE product_categories.companyId = Company.id 
              AND product_categories.rejectStatus IS NULL)`
          ),
          "pendingCategoryCount",
        ],
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM product_categories 
              WHERE product_categories.companyId = Company.id 
              AND product_categories.rejectStatus = false)`
          ),
          "rejectedCategoryCount",
        ],
      ],
      include: [
        {
          model: ProductCategory,
          as: "productCategories",
          attributes: [],
        },
      ],
      group: ["id"],
      having: sequelize.literal(
        `(SELECT COUNT(*) FROM product_categories 
          WHERE product_categories.companyId = Company.id 
          AND product_categories.rejectStatus = true) > 0 
        OR 
        (SELECT COUNT(*) FROM product_categories 
          WHERE product_categories.companyId = Company.id 
          AND product_categories.rejectStatus IS NULL) > 0`
      ),

      order: [[sequelize.literal("pendingCategoryCount"), "DESC"]],
      offset,
      limit,
    });

    const result = data.map((item) => ({
      id: item.id,
      companyName: item.get("companyName"),
      approvedCategoryCount: item.get("approvedCategoryCount"),
      pendingCategoryCount: item.get("pendingCategoryCount"),
      status: getStatus(
        item.get("approvedCategoryCount"),
        item.get("pendingCategoryCount"),
        item.get("rejectedCategoryCount")
      ),
    }));

    res.status(200).json({
      success: true,
      data: {
        data: result,
        pagination: {
          totalItems: count.length, // Since count is an array due to groupBy
          totalPages: Math.ceil(count.length / pageSize),
          currentPage: parseInt(page),
          perPage: parseInt(pageSize),
        },
      },
    });
  } catch (error) {
    logger.error("Error while feching company with product category count", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch company category statistics",
      error: error.message,
    });
  }
};

exports.unMapped = async (req, res) => {
  try {
    await ProductCategory.update(
      {
        rejectStatus: null,
        rejectNote: null,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Category unmapped successfully",
    });
  } catch (error) {
    logger.error("Error while unmapping product category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to unmapped category" });
  }
};

// exports.getCompanyWithProductCategoryCount = async (req, res, next) => {
//   const { companyId, page = 1, pageSize = 10 } = req.query;

//   const whereClause = {};
//   if (!isNaN(companyId)) {
//     whereClause.id = companyId;
//   }
//   const offset = (page - 1) * pageSize;
//   const limit = pageSize;

//   try {
//     const data = await Company.findAll({
//       where: whereClause,
//       attributes: [
//         "id",
//         "companyName",
//         [
//           sequelize.literal(
//             `(SELECT COUNT(*) FROM product_categories
//               WHERE product_categories.companyId = Company.id
//               AND product_categories.rejectStatus = true)`
//           ),
//           "approvedCategoryCount",
//         ], // Approved categories count
//         [
//           sequelize.literal(
//             `(SELECT COUNT(*) FROM product_categories
//               WHERE product_categories.companyId = Company.id
//               AND product_categories.rejectStatus IS NULL)`
//           ),
//           "pendingCategoryCount",
//         ], // Pending categories count
//         [
//           sequelize.literal(
//             `(SELECT COUNT(*) FROM product_categories
//               WHERE product_categories.companyId = Company.id
//               AND product_categories.rejectStatus = false)`
//           ),
//           "rejectedCategoryCount",
//         ], // Reject categories count
//       ],
//       include: [
//         {
//           model: ProductCategory,
//           as: "productCategories",
//           attributes: [],
//         },
//       ],
//       group: ["id"],
//       having: sequelize.literal(
//         "approvedCategoryCount > 0 OR pendingCategoryCount > 0"
//       ),
//       order: [[sequelize.literal("pendingCategoryCount"), "DESC"]],
//       offset,
//       limit,
//     });

//     const result = data.map((item) => ({
//       id: item.id,
//       companyName: item.get("companyName"),
//       approvedCategoryCount: item.get("approvedCategoryCount"),
//       pendingCategoryCount: item.get("pendingCategoryCount"),
//       status: getStatus(
//         item.get("approvedCategoryCount"),
//         item.get("pendingCategoryCount"),
//         item.get("rejectedCategoryCount")
//       ),
//     }));

//     res.status(200).json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch company category statistics",
//       error: error.message,
//     });
//   }
// };
