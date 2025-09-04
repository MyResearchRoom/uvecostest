const { Op } = require("sequelize");
const { MainCategory, ProductCategory, sequelize } = require("../models");
const logger = require("../utils/logger");
const { imageFormats } = require("../utils/constants");

`Reject status true means category approve, and false means category rejected`;

exports.createMainCategory = async (req, res) => {
  const { name, description } = req.body;

  if (
    !name ||
    name.trim() === "" ||
    name.trim().length < 3 ||
    name.trim().length > 100
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category name" });
  }

  if (
    !description ||
    description.trim().length < 3 ||
    description.trim().length > 200
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid category description, must be between 3 and 200 characters",
    });
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
    const isExists = await MainCategory.findOne({
      where: {
        name,
      },
    });

    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Main category already exists" });
    }
    const mainCategory = await MainCategory.create({
      name,
      description,
      image: req.file.buffer,
      contentType: req.file.mimetype,
    });

    logger.info("Main category has been created", {
      actionBy: req.user.id,
      mainCategoryId: mainCategory.id,
    });

    res.status(201).json({
      success: true,
      message: "Main Category created successfully",
      data: {
        id: mainCategory.id,
        name: mainCategory.name,
        description: mainCategory.description,
        image: `data:${
          mainCategory.contentType
        };base64,${mainCategory.image.toString("base64")}`,
      },
    });
  } catch (error) {
    logger.error("Error while creating main category", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create Main Category",
    });
  }
};

exports.getAllMainCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchTerm = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereCondition = searchTerm
      ? {
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${searchTerm}%`,
              },
            },
            {
              description: {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          ],
        }
      : {};

    const { count, rows: mainCategories } = await MainCategory.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const data = mainCategories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      image: `data:${category.contentType};base64,${category.image.toString(
        "base64"
      )}`,
    }));

    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          perPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error while feching main categories", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch Main Categories",
    });
  }
};

exports.getAllMainCategoriesNames = async (req, res) => {
  try {
    const mainCategories = await MainCategory.findAll({
      attributes: ["id", "name"],
    });
    res.status(200).json({
      success: true,
      data: mainCategories,
    });
  } catch (error) {
    logger.error("Error while fetching main categories names", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch Main Categories Names",
    });
  }
};

exports.getAllMainCategoriesImages = async (req, res) => {
  try {
    const mainCategories = await MainCategory.findAll({
      attributes: ["id", "name", "image", "contentType"],
    });

    const data = mainCategories.map((category) => ({
      id: category.id,
      name: category.name,
      image: `data:${category.contentType};base64,${category.image.toString(
        "base64"
      )}`,
    }));
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error("Error while fetching main categories images", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch Main Categories Names",
    });
  }
};

exports.getMainCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const mainCategory = await MainCategory.findByPk(id);

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: "Main Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: mainCategory.id,
        name: mainCategory.name,
        description: mainCategory.description,
        image: `data:${
          mainCategory.contentType
        };base64,${mainCategory.image.toString("base64")}`,
      },
    });
  } catch (error) {
    logger.error("Error while fetching main category by id", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch Main Category",
    });
  }
};

exports.updateMainCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 100) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category name" });
  }

  if (
    !description ||
    description.trim().length < 3 ||
    description.trim().length > 200
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category description" });
  }

  try {
    const isExists = await MainCategory.findOne({
      where: {
        name,
        id: { [Op.not]: id },
      },
    });

    if (isExists) {
      return res.status(404).json({
        success: false,
        message: "Category with name '" + name + "' already exists",
      });
    }

    const updationData = { name };
    if (description) {
      updationData.description = description;
    }
    if (req.file) {
      if (!imageFormats.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPEG and PNG images are allowed",
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
    }

    await MainCategory.update(updationData, {
      where: {
        id: id,
      },
    });

    logger.info("Main category has been updated", {
      actionBy: req.user.id,
      mainCategoryId: id,
    });

    res.status(200).json({
      success: true,
      message: "Main Category updated successfully",
      data: {
        name: updationData.name,
        description: updationData.description,
        image: `data:${
          updationData.contentType
        };base64,${updationData.image?.toString("base64")}`,
      },
    });
  } catch (error) {
    logger.error("Error while updating main category", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update Main Category",
    });
  }
};

exports.deleteMainCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const mainCategory = await MainCategory.findByPk(id);

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: "Main Category not found",
      });
    }

    await mainCategory.destroy();

    logger.info("Main category has been deleted", {
      actionBy: req.user.id,
      mainCategoryId: id,
    });

    res.status(200).json({
      success: true,
      message: "Main Category deleted successfully",
    });
  } catch (error) {
    logger.error("Error while deleting main category", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete Main Category",
    });
  }
};

exports.connectCategories = async (req, res) => {
  const { mainCategoryId, subCategoryIds } = req.body;

  const transaction = await sequelize.transaction();
  try {
    const mainCategory = await MainCategory.findByPk(mainCategoryId);

    if (!mainCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Main Category not found" });
    }
    await ProductCategory.update(
      { mainCategoryId, rejectStatus: true, approvedAt: new Date() },
      {
        where: {
          id: {
            [Op.in]: subCategoryIds,
          },
        },
      },
      { transaction }
    );

    await transaction.commit();

    logger.info(`Product categories connected to main category`, {
      actionBy: req.user.id,
      mainCategoryId,
      productCategoryIds: subCategoryIds,
    });

    res
      .status(200)
      .json({ success: true, message: "Categories mapped successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while connecting categories", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to mapped categories" });
  }
};

exports.rejectCategories = async (req, res) => {
  const { rejectNote, categoryIds } = req.body;

  const transaction = await sequelize.transaction();
  try {
    await ProductCategory.update(
      { rejectNote, rejectStatus: false },
      {
        where: {
          id: {
            [Op.in]: categoryIds,
          },
        },
        transaction,
      }
    );

    await transaction.commit();
    res
      .status(200)
      .json({ success: true, message: "Categories rejected successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while rejecting categories", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to reject categories" });
  }
};
