const { Op } = require("sequelize");
const {
  User,
  Distributor,
  DistributorBusinessDocument,
  sequelize,
} = require("../models");
const { encryptSensitiveData } = require("../utils/cryptography");
const bcrypt = require("bcrypt");
const { validatePassword } = require("../middlewares/validations");

const distributorService = require("../services/distributorService");
const logger = require("../utils/logger");

// Create a new distributor
const validateDistributorData = async (email, mobileNumber, userId = null) => {
  const whereClause = {
    [Op.or]: [{ email }, { mobileNumber }],
  };
  if (userId) {
    whereClause["id"] = { [Op.ne]: userId };
  }
  const duplicateCheck = await User.findOne({ where: whereClause });

  if (duplicateCheck) {
    return true;
  }

  return false;
};

exports.createDistributor = async (req, res, next) => {
  const { name, email, mobileNumber, password, ...rest } = req.body;
  const documents = req.files["documents[]"];
  const qrCode = req.files["qrCode"]?.[0];

  if (!documents || documents.length > 5) {
    return res
      .status(400)
      .json({ success: false, message: "Provide business documents, max 5" });
  }

  if (!qrCode) {
    return res.status(400).json({ success: false, message: "Provide QR code" });
  }

  const transaction = await sequelize.transaction();

  try {
    const isExists = await validateDistributorData(email, mobileNumber);

    if (isExists) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number already exists",
      });
    }

    // Hash the password
    if (validatePassword(password) !== true) {
      return res
        .status(400)
        .json({ success: false, message: validatePassword(password) });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const encryptedData = {
      accountNumber: encryptSensitiveData(rest.accountNumber),
      ifscCode: encryptSensitiveData(rest.ifscCode),
      taxIdentificationNumber: encryptSensitiveData(
        rest.taxIdentificationNumber
      ),
      liscenseNumber: encryptSensitiveData(rest.liscenseNumber),
    };

    const user = await User.create(
      {
        name,
        email,
        mobileNumber,
        password: hashedPassword,
        addedBy: req.user.id,
        country: "India",
        role: "distributor",
      },
      { transaction }
    );

    const distributor = await Distributor.create(
      {
        ...rest,
        ...encryptedData,
        qrCode: qrCode.buffer,
        qrCodeContentType: qrCode.mimetype,
        userId: user.id,
        companyId: req.user.companyId,
      },
      { transaction }
    );

    const businessDocuments = documents.map((doc) => ({
      fileName: doc.originalname,
      file: encryptSensitiveData(
        `data:${doc.mimetype};base64,${doc.buffer.toString("base64")}`
      ),
      distributorId: distributor.id,
    }));

    await DistributorBusinessDocument.bulkCreate(businessDocuments, {
      transaction,
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Distributor created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: distributor.city,
      },
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error while adding distributor", {
          error: error.message,
          stack: error.stack,
        });
    res
      .status(500)
      .json({ success: false, message: "Failed to create distributor" });
  }
};

exports.getDistributors = async (req, res, next) => {
  const { page = 1, limit = 10, searchTerm = "" } = req.query;

  try {
    const offset = (page - 1) * limit;

    const { count, rows } = await Distributor.findAndCountAll({
      where: {
        companyId: req.user.companyId,
        [Op.or]: [
          { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
          { city: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      attributes: ["id", "city", "priceRule"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "mobileNumber"],
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    // Map the rows to format data properly
    const distributors = rows.map((row) => ({
      id: row.id,
      name: row.user?.name || null,
      email: row.user?.email || null,
      mobileNumber: row.user?.mobileNumber || null,
      city: row.city,
      priceRule: row.priceRule,
      userId: row.user?.id || null,
    }));

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: distributors,
      pagination: {
        count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Error while feching distributor", {
          error: error.message,
          stack: error.stack,
        });
    res.status(500).json({
      success: false,
      message: "Failed to fetch distributors. Please try again later.",
    });
  }
};

exports.getDistributorById = async (req, res, next) => {
  const { id } = req.params;
  companyId = req.user.companyId;

  try {
    const distributor = await distributorService.getDistributorById(id);
    if (distributor.companyId !== companyId) {
      const error = new Error(
        "You do not have permission to access this distributor"
      );
      error.status = 403;
      throw error;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while fetching distributor by id", {
      error: error.message,
       stack: error.stack,
       });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.updateDistributor = async (req, res, next) => {
  const { id } = req.params;

  const {
    name,
    email,
    mobileNumber,
    pinCode,
    street,
    baseAddress,
    city,
    district,
    state,
    postalCodes,
    country,
    region,
    productsCategory,
    taxIdentificationNumber,
    liscenseNumber,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    password,
    upiId,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Fetch distributor
    const distributor = await Distributor.findByPk(id, { transaction });
    if (!distributor) {
      throw new Error("Distributor not found");
    }

    // Validate email and mobile number
    const duplicateCheck = await validateDistributorData(
      email,
      mobileNumber,
      distributor.userId
    );
    if (duplicateCheck) {
      throw new Error("Email or Mobile Number already exists");
    }

    // Encrypt sensitive data
    const encryptedData = {
      liscenseNumber: liscenseNumber
        ? encryptSensitiveData(liscenseNumber)
        : distributor.liscenseNumber,
      accountNumber: accountNumber
        ? encryptSensitiveData(accountNumber)
        : distributor.accountNumber,
      ifscCode: ifscCode
        ? encryptSensitiveData(ifscCode)
        : distributor.ifscCode,
      taxIdentificationNumber: taxIdentificationNumber
        ? encryptSensitiveData(taxIdentificationNumber)
        : distributor.taxIdentificationNumber,
    };

    // Process QR code
    const qrCode = req.files?.["qrCode"]?.[0];
    const qrCodeData = qrCode
      ? {
          qrCode: qrCode.buffer,
          qrCodeContentType: qrCode.mimetype,
        }
      : {};

    // Update user details
    const userData = { name, email, mobileNumber };
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }
    await User.update(userData, {
      where: { id: distributor.userId },
      transaction,
    });

    // Update distributor details
    await distributor.update(
      {
        pinCode,
        street,
        baseAddress,
        city,
        district,
        state,
        postalCodes,
        country: "India",
        region,
        productsCategory,
        ...encryptedData,
        ...qrCodeData,
        bankName,
        branchName,
        upiId,
      },
      { transaction }
    );

    // Handle business documents
    const documents = req.files?.["documents[]"];
    if (documents?.length) {
      const businessDocuments = documents.map((doc) => ({
        fileName: doc.originalname,
        file: encryptSensitiveData(
          `data:${doc.mimetype};base64,${doc.buffer.toString("base64")}`
        ),
        distributorId: distributor.id,
      }));
      await DistributorBusinessDocument.bulkCreate(businessDocuments, {
        transaction,
      });
    }

    // Commit transaction
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Distributor updated successfully",
    });
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    logger.error("Error while updating distributor", {
          error: error.message,
          stack: error.stack,
        });
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update distributor",
    });
  }
};

exports.deleteDistributor = async (req, res, next) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const distributor = await Distributor.findByPk(id, { transaction });

    if (!distributor) {
      return res
        .status(404)
        .json({ success: false, message: "Distributor not found" });
    }

    // Delete associated documents
    await DistributorBusinessDocument.destroy({
      where: { distributorId: id },
      transaction,
    });

    // Delete distributor record
    const userId = distributor.userId; // Save userId before deletion
    await distributor.destroy({ transaction });

    // Delete the associated user
    const user = await User.findByPk(userId, { transaction });
    if (user) {
      await user.destroy({ transaction });
    }

    // Commit transaction
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Distributor deleted successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while deleting distributor", {
          error: error.message,
          stack: error.stack,
        });
    res.status(500).json({
      success: false,
      message:
        "An error occurred while deleting the distributor. Please try again.",
    });
  }
};

exports.getDistributorAddress = async (req, res, next) => {
  const userId = req.user.id;
  const transaction = await sequelize.transaction();
  try {
    const distributor = await distributorService.getDistributorAddress(userId);
    res.status(200).json({ success: true, data: distributor });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while getting distributor address", {
      error: error.message,
      stack: error.stack,
      });
    res.status(500).json({ success: false, message: "Error fetching address" });
  }
};
