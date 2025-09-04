const { Op } = require("sequelize");
const { Supplier } = require("../models");
const logger = require("../utils/logger");

// Create a new supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      pinCode,
      street,
      baseAddress,
      city,
      district,
      state,
      country,
      category,
    } = req.body;

    const existingSupplierWithMobileNumber = await Supplier.findOne({
      where: {
        [Op.or]: {
          mobileNumber,
          email,
        },
      },
    });

    if (existingSupplierWithMobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number already exists",
      });
    }

    const supplier = await Supplier.create({
      name,
      mobileNumber,
      email,
      pinCode,
      street,
      baseAddress,
      city,
      district,
      state,
      country: "India",
      category,
      companyId: req.user.companyId,
    });

    res.status(201).json({
      message: "Supplier created successfully",
      data: supplier,
      success: true,
    });
  } catch (error) {
    logger.error("Error while adding supplier", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to create supplier" });
  }
};

exports.getAllSuppliers = async (req, res, next) => {
  const { page = 1, limit = 10, searchTerm = "", category } = req.query;
  const whereClause = { companyId: req.user.companyId };
  if (category && ["local", "international"].includes(category)) {
    whereClause.category = category;
  }
  if (searchTerm && searchTerm.trim() !== "") {
    whereClause.name = { [Op.like]: `%${searchTerm}%` };
  }

  try {
    const offset = (page - 1) * limit;
    const { count, rows: suppliers } = await Supplier.findAndCountAll({
      where: whereClause,
      offset,
      limit: parseInt(limit),
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Error while feching suppliers", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers. Please try again later.",
    });
  }
};

exports.getAllSuppliersWithIdAndName = async (req, res, next) => {
  try {
    const suppliers = await Supplier.findAll({
      where: {
        companyId: req.user.companyId,
      },
      attributes: ["id", "name"],
    });

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    logger.error("Error while fetching suppliers", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers. Please try again later.",
    });
  }
};

// Get a supplier by ID
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    if (supplier.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this supplier",
      });
    }

    res.status(200).json({ data: supplier, success: true });
  } catch (error) {
    logger.error("Error while fetching supplier", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch supplier" });
  }
};

// Update a supplier
exports.updateSupplier = async (req, res, next) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      pinCode,
      street,
      baseAddress,
      city,
      district,
      state,
      country,
      category,
    } = req.body;

    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    if (supplier.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to update this supplier",
      });
    }

    const existingSupplierWithMobileNumber = await Supplier.findOne({
      where: {
        id: {
          [Op.ne]: req.params.id,
        },
        [Op.or]: {
          mobileNumber,
          email,
        },
      },
    });

    if (existingSupplierWithMobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number already exists",
      });
    }

    await supplier.update({
      name,
      mobileNumber,
      email,
      pinCode,
      street,
      baseAddress,
      city,
      district,
      state,
      country: "India",
      category,
    });

    res.status(200).json({
      message: "Supplier updated successfully",
      data: supplier,
      success: true,
    });
  } catch (error) {
    logger.error("Error while updating store", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to update supplier", success: false });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      return res
        .status(404)
        .json({ message: "Supplier not found", success: false });
    }

    if (supplier.companyId !== req.user.companyId) {
      return res.status(403).json({
        message: "You do not have permission to delete this supplier",
        success: false,
      });
    }

    await supplier.destroy();
    res
      .status(200)
      .json({ message: "Supplier deleted successfully", success: true });
  } catch (error) {
    logger.error("Error while deleting supplier", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to delete supplier", success: false });
  }
};
