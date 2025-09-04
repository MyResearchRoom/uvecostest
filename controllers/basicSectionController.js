const { Op } = require("sequelize");
const { BasicSection, BasicSubSection } = require("../models");
const logger = require("../utils/logger");

exports.addBasicSection = async (req, res, next) => {
  const { name } = req.body;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid section name" });
  }

  try {
    const isExists = await BasicSection.findOne({
      where: {
        name,
        companyId: req.user.companyId,
      },
    });
    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Section already exists" });
    }
    const basicSection = await BasicSection.create({
      name,
      companyId: req.user.companyId,
    });
    res.status(201).json({
      success: true,
      message: "Section added successfully",
      data: basicSection,
    });
  } catch (error) {
    logger.error("Error while adding basic section", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed too add section" });
  }
};

exports.getAllSections = async (req, res, next) => {
  try {
    const sections = await BasicSection.findAll({
      where: { companyId: req.user.companyId },
    });
    res.status(200).json({
      success: true,
      message: "Sections fetched successfully",
      data: sections,
    });
  } catch (error) {
    logger.error("Error while feching basic sections", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get sections",
    });
  }
};

exports.updateBasicSection = async (req, res, next) => {
  const { name } = req.body;
  const id = req.params.id;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid section name" });
  }

  try {
    const isExists = await BasicSection.findOne({
      where: {
        name,
        companyId: req.user.companyId,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Section already exists" });
    }

    const basicSection = await BasicSection.update(
      { name },
      { where: { id, companyId: req.user.companyId } }
    );

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      data: basicSection,
    });
  } catch (error) {
    logger.error("Error while updating basic section", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update category" });
  }
};

exports.deleteBasicSection = async (req, res, next) => {
  const id = req.params.id;
  try {
    const basicSection = await BasicSection.destroy({
      where: { id, companyId: req.user.companyId },
    });
    if (!basicSection) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting basic section", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete section" });
  }
};

exports.addBasicSubSection = async (req, res, next) => {
  const { name, basicSectionId } = req.body;
  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid sub section value" });
  }

  try {
    const basicSection = await BasicSection.findOne({
      where: { id: basicSectionId, companyId: req.user.companyId },
    });

    if (!basicSection) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    const isExists = await BasicSubSection.findOne({
      where: { name, basicSectionId },
    });
    if (isExists) {
      return res
        .status(400)
        .json({ success: false, message: "Sub section already exists " });
    }
    const basicSubSection = await BasicSubSection.create({
      name,
      basicSectionId,
    });

    res.status(201).json({
      success: true,
      message: "Sub section added successfully",
      data: basicSubSection,
    });
  } catch (error) {
    logger.error("Error while adding basic sub section", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to add sub section" });
  }
};

exports.getAllSubSections = async (req, res, next) => {
  const { id: basicSectionId } = req.params;
  try {
    const basicSubSections = await BasicSubSection.findAll({
      where: { basicSectionId },
      include: [
        {
          model: BasicSection,
          as: "basicSection",
          where: {
            companyId: req.user.companyId,
          },
        },
      ],
    });

    res.status(200).json({ success: true, data: basicSubSections || [] });
  } catch (error) {
    logger.error("Error while getting all sub sections", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get sub sections" });
  }
};

exports.updateBasicSubSection = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "" || name.length < 3 || name.length > 50) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid sub section value" });
  }

  try {
    const basicSubSection = await BasicSubSection.findOne({
      where: { id },
      include: [
        {
          model: BasicSection,
          as: "basicSection",
          where: {
            companyId: req.user.companyId,
          },
        },
      ],
    });

    if (!basicSubSection) {
      return res
        .status(404)
        .json({ success: false, message: "Sub section not found" });
    }

    const isExists = await BasicSubSection.findOne({
      where: {
        name,
        basicSectionId: basicSubSection.basicSectionId,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (isExists) {
      return res
        .status(500)
        .json({ success: false, message: "Sub section already exists" });
    }

    basicSubSection.name = name;

    await basicSubSection.save();

    res.status(200).json({
      success: true,
      message: "Sub section updated successfully",
      BasicSubSection,
    });
  } catch (error) {
    logger.error("Error while updating basic sub section", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update sub section" });
  }
};

exports.deleteBasicSubSection = async (req, res, next) => {
  const { id } = req.params;
  try {
    const basicSubSection = await BasicSubSection.destroy({ where: { id } });
    res.status(200).json({
      success: true,
      message: "Sub section deleted successfully",
      data: basicSubSection,
    });
  } catch (error) {
    logger.error("Error while deleting basic sub section", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete sub section" });
  }
};
