const {
  PlatformSliderImage,
  CompanySliderImage,
  sequelize,
} = require("../models");
const logger = require("../utils/logger");

exports.addPlatformSliderImage = async (req, res, next) => {
  const { type } = req.body;
  const images = req.files;

  // Validate type
  if (!["offerSlider", "heroSlider"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Allowed types: 'offerSlider' or 'heroSlider'.",
    });
  }

  // Validate images
  if (!images || images.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No images provided. Please upload at least one image.",
    });
  }

  // Prepare images data
  const imagesData = images.map((img) => ({
    image: img.buffer,
    contentType: img.mimetype,
    type,
  }));

  let transaction;
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Bulk create images
    const createdImages = await PlatformSliderImage.bulkCreate(imagesData, {
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    // Prepare response data
    const responseData = createdImages.map((item) => ({
      id: item.id,
      image: `data:${item.contentType};base64,${item.image.toString("base64")}`,
    }));

    return res.status(201).json({
      success: true,
      message: "Images added successfully.",
      data: responseData,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while adding platform slider image", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to add slider images. Please try again later.",
    });
  }
};

exports.deletePlatformSliderImage = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the platform slider image
    const platformSliderImage = await PlatformSliderImage.findOne({
      where: {
        id,
      },
    });

    // Check if the image exists
    if (!platformSliderImage) {
      return res.status(404).json({
        success: false,
        message: `No image found!`,
      });
    }

    // Delete the image
    await platformSliderImage.destroy();

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    // Respond with an error
    logger.error("Error while deleting platform slider image", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to delete image. Please try again later.",
    });
  }
};

exports.getPlatformSliderImages = async (req, res, next) => {
  const type = req.query.type;
  if (!["offerSlider", "heroSlider"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Allowed types: 'offerSlider' or 'heroSlider'.",
    });
  }

  try {
    const platformSliderImages = await PlatformSliderImage.findAll({
      where: {
        type,
      },
    });
    const data = platformSliderImages.map((img) => ({
      id: img.id,
      image: `data:${img.contentType};base64,${img.image.toString("base64")}`,
    }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting platform slider images", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to get images" });
  }
};

exports.addCompanySliderImage = async (req, res, next) => {
  const { type } = req.body;
  const images = req.files;

  // Validate type
  if (type !== "offerSlider" && type !== "heroSlider") {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Valid types are 'offerSlider' or 'heroSlider'.",
    });
  }

  // Validate images
  if (!images || images.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No images provided. Please upload at least one image.",
    });
  }

  // Prepare image data
  const imagesData = images.map((img) => ({
    image: img.buffer,
    contentType: img.mimetype,
    type,
    companyId: req.user.companyId,
  }));

  // Transaction for database operations
  const transaction = await sequelize.transaction();
  try {
    // Insert images into the database
    const createdImages = await CompanySliderImage.bulkCreate(imagesData, {
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    // Format response data
    const result = createdImages.map((item) => ({
      id: item.id,
      image: `data:${item.contentType};base64,${item.image.toString("base64")}`,
    }));

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Images added successfully.",
      data: result,
    });
  } catch (error) {
    // Rollback the transaction on error
    if (transaction) await transaction.rollback();
    logger.error("Error while adding company slider images", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to add slider images. Please try again later.",
    });
  }
};

exports.deleteCompanySliderImage = async (req, res, next) => {
  const id = req.params.id;
  try {
    const companySliderImage = await CompanySliderImage.findOne({
      where: {
        id: id,
        companyId: req.user.companyId,
      },
    });
    if (!companySliderImage) {
      return res.status(404).json({ message: "Image not found!" });
    }
    await companySliderImage.destroy();
    res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting company slider image", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to delete image" });
  }
};

exports.getCompanySliderImages = async (req, res, next) => {
  const type = req.query.type;
  let companyId = req?.query?.companyId;

  if (req.url.startsWith("/company-user")) {
    companyId = req.user.companyId;
  }

  if (!companyId || isNaN(parseInt(companyId))) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid company id" });
  }

  if (!["offerSlider", "heroSlider"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid type. Allowed types: 'offerSlider' or 'heroSlider'.",
    });
  }

  try {
    const companySliderImages = await CompanySliderImage.findAll({
      where: {
        type: type,
        companyId: companyId,
      },
    });
    const data = companySliderImages.map((img) => ({
      id: img.id,
      image: `data:${img.contentType};base64,${img.image.toString("base64")}`,
    }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting company slider images", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get company slider images" });
  }
};
