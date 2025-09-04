const {
  User,
  Company,
  ExtraDocument,
  RefreshToken,
  sequelize,
} = require("../models");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { jwt_secret, refresh_jwt_secret } = require("../config/config");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");

const {
  encryptSensitiveData,
  decryptSensitiveData,
  getDecryptedDocumentAsBase64,
} = require("../utils/cryptography");

const { Op } = require("sequelize");

const { validatePassword } = require("../middlewares/validations");
const logger = require("../utils/logger");
const {
  getStoreType,
  sendForgotPasswordOTP,
  verifyOTP,
  resetPassword,
} = require("../services/AuthService");
const { imageFormats } = require("../utils/constants");

const mandatoryDocuments = [
  "Company Incorporation Certificate",
  "GST Certificate",
  "Company Address Proof",
  "Company PAN CARD",
  "Company TAN CARD",
  "Directors AADHAR CARD",
  "Directors PAN CARD",
  "Directors Address Proof",
  "Company account Cancel Cheque",
  "Company Director Digital Photo",
];

const nonMandatoryDocuments = [
  "Company IEC",
  "Company FSSAI Licence",
  "Company RCMC Certificate",
  "Company UDYAM Certificate",
  "Company Startup registration Certificate",
  "Company MOA",
  "Company AOA",
];

exports.registerPlatformUser = async (req, res, next) => {
  const { name, email, mobileNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({
      where: {
        mobileNumber,
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is already exists" });
    }

    if (email) {
      const existingEmailUser = await User.findOne({
        where: {
          email,
        },
      });

      if (existingEmailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role: "platformUser",
      email: email || null,
      mobileNumber,
      password: hashedPassword,
    });

    user.password = "";

    res.status(201).json({
      success: true,
      message: "User register successsfully",
      data: user,
    });
  } catch (error) {
    logger.error("Error while processing platform user registration", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to register" });
  }
};

exports.customerRegistration = async (req, res, next) => {
  const { name, email, mobileNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({
      where: {
        mobileNumber,
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is already exists" });
    }

    if (email) {
      const existingEmailUser = await User.findOne({
        where: {
          email,
        },
      });

      if (existingEmailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role: "customer",
      email: email || null,
      mobileNumber,
      password: hashedPassword,
    });

    user.password = "";

    res.status(201).json({
      success: true,
      message: "User register successsfully",
      data: user,
    });
  } catch (error) {
    logger.error("Error while processing customer registration", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to register" });
  }
};

exports.registerCompanyUser = async (req, res, next) => {
  const {
    licenseNumber,
    panNumber,
    gstNumber,
    tanNumber,
    taxIdentificationNumber,
    dinNumber,
    accountNumber,
    ifscCode,
    primaryContactPersonName,
    primaryEmail,
    primaryPhoneNumber,
    documentTypes,
    password,
    ...rest
  } = req.body;
  const transaction = await sequelize.transaction();
  const files = req.files["documents[]"];
  const logoData = req.files["logo"]?.[0];

  if (!logoData) {
    return res
      .status(400)
      .json({ success: false, message: "Company logo is required" });
  }

  if (!imageFormats.includes(logoData.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only image is allowed",
    });
  }

  if (logoData.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Image size should not exceed 5MB",
    });
  }

  if (!documentTypes || documentTypes.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No document types provided" });
  }

  if (documentTypes.length !== files.length) {
    return res.status(400).json({
      success: false,
      message: "Mismatch between document types and files",
    });
  }

  const missingMandatoryDocs = mandatoryDocuments.filter(
    (doc) => !documentTypes.includes(doc)
  );

  if (missingMandatoryDocs.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing mandatory documents: ${missingMandatoryDocs.join(
        ", "
      )}`,
    });
  }

  try {
    // Check if the mobile number already exists
    const existingUser = await User.findOne(
      { where: { mobileNumber: primaryPhoneNumber } },
      { transaction }
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Primary phone number is already exists",
      });
    }

    // Check if the email already exists (if provided)
    if (primaryEmail) {
      const existingEmailUser = await User.findOne(
        { where: { email: primaryEmail } },
        { transaction }
      );

      if (existingEmailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Primary email is already exists" });
      }
    }

    // Hash the password
    if (validatePassword(password) !== true) {
      return res
        .status(400)
        .json({ success: false, message: validatePassword(password) });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const encryptedLiscenseNumber = licenseNumber
      ? encryptSensitiveData(licenseNumber)
      : null;
    const encryptedPanNumber = panNumber
      ? encryptSensitiveData(panNumber)
      : null;
    const encryptedGstNumber = gstNumber
      ? encryptSensitiveData(gstNumber)
      : null;
    const encryptedTanNumber = tanNumber
      ? encryptSensitiveData(tanNumber)
      : null;
    const encryptedAccountNumber = accountNumber
      ? encryptSensitiveData(accountNumber.toString())
      : null;
    const encryptedIfscCode = ifscCode ? encryptSensitiveData(ifscCode) : null;
    const encryptedTaxIdentificationNumber = taxIdentificationNumber
      ? encryptSensitiveData(taxIdentificationNumber)
      : null;
    const encryptedDinNumber = dinNumber
      ? encryptSensitiveData(dinNumber)
      : null;

    // Create the company user
    const user = await User.create(
      {
        name: primaryContactPersonName,
        role: "companyUser",
        email: primaryEmail || null,
        mobileNumber: primaryPhoneNumber,
        password: hashedPassword,
        addedBy: req.user.id,
      },
      { transaction }
    );

    const company = await Company.create(
      {
        licenseNumber: encryptedLiscenseNumber,
        panNumber: encryptedPanNumber,
        gstNumber: encryptedGstNumber,
        tanNumber: encryptedTanNumber,
        taxIdentificationNumber: encryptedTaxIdentificationNumber,
        dinNumber: encryptedDinNumber,
        accountNumber: encryptedAccountNumber,
        ifscCode: encryptedIfscCode,
        userId: user.id,
        logo: logoData.buffer,
        contentType: logoData.mimetype,
        ...rest,
      },
      { transaction }
    );

    const documentsData = [];

    for (let i = 0; i < documentTypes.length; i++) {
      const file = files[i];
      const documentType = documentTypes[i];
      if (file.mimetype !== "application/pdf") {
        throw new Error("All documents must be in pdf format");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Document size must be less than 5MB");
      }

      documentsData.push({
        documentType,
        fileName: file.originalname,
        file: encryptSensitiveData(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        ),
        companyId: company.id,
      });
    }

    await ExtraDocument.bulkCreate(documentsData, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "User and company registered successfully",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error while processing company registration", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to register user and company",
    });
  }
};

exports.getCompanies = async (req, res, next) => {
  const { status, searchTerm, page = 1, pageSize = 10 } = req.query;

  const limit = parseInt(pageSize, 10) || 10;
  const offset = (parseInt(page, 10) - 1) * limit;

  const whereClause = {};
  if (status == "true" || status == "false") {
    whereClause.isBlock = status == "true" ? true : false;
  }
  if (searchTerm && searchTerm.length > 0) {
    whereClause[Op.or] = [
      { companyName: { [Op.like]: `%${searchTerm}%` } },
      { industryType: { [Op.like]: `%${searchTerm}%` } },
      { city: { [Op.like]: `%${searchTerm}%` } },
    ];
  }

  try {
    const { rows: companies, count } = await Company.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "companyName",
        "industryType",
        "city",
        "licenseNumber",
        "isBlock",
      ],
      include: [
        {
          model: User,
          attributes: ["id", "email", "mobileNumber"],
          as: "user",
          required: true,
        },
      ],
      limit,
      offset,
    });

    // Decrypt sensitive data (if applicable)
    const decryptedData = companies.map((company) => {
      if (company.licenseNumber) {
        company.licenseNumber = decryptSensitiveData(company.licenseNumber);
      }
      return company;
    });

    // Return paginated response
    res.status(200).json({
      success: true,
      data: decryptedData,
      pagination: {
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error("Error while getting companies list", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get company users" });
  }
};

exports.getManagers = async (req, res, next) => {
  try {
    const managers = await User.findAll({
      where: {
        role: {
          [Op.in]: ["productManager", "orderManager", "warrantyManager"],
        },
        companyId: req.user.companyId,
      },
    });

    res.status(200).json({ success: true, data: managers });
  } catch (error) {
    logger.error("Error while getting manager's list", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to get managers" });
  }
};

exports.getCompanyNames = async (req, res, next) => {
  const searchTerm = req.query.searchTerm;
  const whereClause = { isBlock: false };
  if (searchTerm) {
    whereClause.companyName = { [Op.like]: `%${searchTerm}%` };
  }
  try {
    const companyNames = await Company.findAll({
      where: whereClause,
      attributes: ["id", "companyName", "logo", "contentType"],
    });

    const data = companyNames.map((company) => ({
      ...company.toJSON(),
      logo: `data:${company.contentType};base64,${company.logo.toString(
        "base64"
      )}`,
    }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting company names", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get company names" });
  }
};

exports.deleteManager = async (req, res, next) => {
  try {
    const manager = await User.destroy({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });
    res.status(200).json({
      success: true,
      data: manager,
      message: "Manager deleted successfully",
    });
  } catch (error) {
    logger.error("Error while deleting manager", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete managers" });
  }
};

exports.updateManager = async (req, res, next) => {
  const { name, email, mobileNumber, role, password } = req.body;

  if (password && !validatePassword(password)) {
    return req.status(400).json({ success: false, message: validatePassword });
  }

  if (!["productManager", "orderManager", "warrantyManager"].includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide valid role" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        mobileNumber,
        id: {
          [Op.ne]: req.params.id,
        },
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is already exists" });
    }

    if (email) {
      const existingEmailUser = await User.findOne({
        where: {
          email,
          id: {
            [Op.ne]: req.params.id,
          },
        },
      });

      if (existingEmailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already exists" });
      }
    }

    const manager = await User.findOne({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
      },
    });
    manager.name = name;
    manager.mobileNumber = mobileNumber;
    manager.email = email;
    manager.role = role;
    if (password) {
      manager.password = await bcrypt.hash(password, 10);
    }
    await manager.save();

    manager.password = "";

    res.status(200).json({
      success: true,
      message: "Manager updated successsfully",
      data: manager,
    });
  } catch (error) {
    logger.error("Error while updating manager", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: true, message: "Failed to register" });
  }
};

exports.getCompanyData = async (req, res, next) => {
  try {
    // Fetch the company data by primary key (ID)
    const companyData = await Company.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "email", "mobileNumber", "name"],
          as: "user",
        },
        {
          model: ExtraDocument,
          attributes: ["id", "documentType", "fileName", "createdAt"],
          as: "extraDocuments",
        },
      ],
    });

    if (!companyData) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Decrypt sensitive fields
    companyData.licenseNumber = companyData.licenseNumber
      ? decryptSensitiveData(companyData.licenseNumber)
      : null;

    companyData.panNumber = companyData.panNumber
      ? decryptSensitiveData(companyData.panNumber)
      : null;

    companyData.gstNumber = companyData.gstNumber
      ? decryptSensitiveData(companyData.gstNumber)
      : null;

    companyData.tanNumber = companyData.tanNumber
      ? decryptSensitiveData(companyData.tanNumber)
      : null;

    companyData.accountNumber = companyData.accountNumber
      ? decryptSensitiveData(companyData.accountNumber)
      : null;

    companyData.ifscCode = companyData.ifscCode
      ? decryptSensitiveData(companyData.ifscCode)
      : null;

    companyData.taxIdentificationNumber = companyData.taxIdentificationNumber
      ? decryptSensitiveData(companyData.taxIdentificationNumber)
      : null;

    companyData.dinNumber = companyData.dinNumber
      ? decryptSensitiveData(companyData.dinNumber)
      : null;

    companyData.logo = `data:${
      companyData.contentType
    };base64,${companyData.logo.toString("base64")}`;

    // const extraDocuments = companyData.extraDocuments;

    // const fixDocuments = [...mandatoryDocuments, ...nonMandatoryDocuments].map(
    //   (documentType) => {
    //     const document = extraDocuments.find(
    //       (doc) => doc.documentType === documentType
    //     );

    //     return document
    //       ? {
    //           ...document.JSON(),
    //           file: getDecryptedDocumentAsBase64(isUploaded.file),
    //         }
    //       : {
    //           id: null,
    //           documentType: documentType,
    //           fileName: null,
    //           file: null,
    //         };
    //   }
    // );

    // const documents = extraDocuments.map((document) => {
    //   if (
    //     ![...mandatoryDocuments, ...nonMandatoryDocuments].includes(
    //       document.documentType
    //     )
    //   ) {
    //     return {
    //       ...document.toJSON(),
    //       file: getDecryptedDocumentAsBase64(document.file),
    //     };
    //   }
    //   return null;
    // });

    // const otherDocuments = documents.filter((document) => document !== null);

    // Send the response with decrypted data
    res.status(200).json({
      success: true,
      data: {
        ...companyData.toJSON(),
        // extraDocuments: null,
        // fixDocuments,
        // otherDocuments,
      },
    });
  } catch (error) {
    logger.error("Error while getting company data", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get company data" });
  }
};

exports.getCompanyDocuments = async (req, res, next) => {
  try {
    const extraDocuments = await ExtraDocument.findAll({
      where: {
        companyId: req.params.id,
      },
    });

    const fixDocuments = [...mandatoryDocuments, ...nonMandatoryDocuments].map(
      (documentType) => {
        const document = extraDocuments.find(
          (doc) => doc.documentType === documentType
        );

        return document
          ? {
              ...document.toJSON(),
              file: getDecryptedDocumentAsBase64(document.file),
            }
          : {
              id: null,
              documentType: documentType,
              fileName: null,
              file: null,
            };
      }
    );

    const documents = extraDocuments.map((document) => {
      if (
        ![...mandatoryDocuments, ...nonMandatoryDocuments].includes(
          document.documentType
        )
      ) {
        return {
          ...document.toJSON(),
          file: getDecryptedDocumentAsBase64(document.file),
        };
      }
      return null;
    });

    const otherDocuments = documents.filter((document) => document !== null);
    res.status(200).json({ success: true, otherDocuments, fixDocuments });
  } catch (error) {
    logger.error("Error while getting company documents", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get company documents" });
  }
};

exports.getCompanyDocument = async (req, res, next) => {
  try {
    const document = await ExtraDocument.findByPk(req.params.id);
    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    res.status(200).json({
      success: true,
      data: getDecryptedDocumentAsBase64(document.file),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get document" });
  }
};

exports.addDocument = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No document provided" });
  }

  if (req.file.mimetype !== "application/pdf") {
    return res
      .status(400)
      .json({ success: false, message: "Only PDF files are allowed" });
  }

  if (!req.body.documentType) {
    return res
      .status(400)
      .json({ success: false, message: "Document type is required" });
  }

  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const isExists = await ExtraDocument.findOne({
      where: {
        companyId: req.params.id,
        documentType: req.body.documentType,
      },
    });

    if (isExists) {
      isExists.file = encryptSensitiveData(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      );
      isExists.fileName = req.file.originalname;
      await isExists.save();
      return res.status(200).json({
        success: true,
        message: "Document updated successfully",
        data: {
          id: isExists.id,
          documentType: isExists.documentType,
          fileName: isExists.fileName,
          createdAt: isExists.updatedAt,
          file: `data:${req.file.mimetype};base64,${req.file.buffer.toString(
            "base64"
          )}`,
        },
      });
    }

    const document = await ExtraDocument.create({
      file: encryptSensitiveData(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      ),
      documentType: req.body.documentType,
      fileName: req.file.originalname,
      companyId: req.params.id,
    });

    document.file = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    res.status(200).json({
      success: true,
      message: "Document added successfully",
      data: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        createdAt: document.updatedAt,
        file: `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
      },
    });
  } catch (error) {
    logger.error("Error while uploading company document", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to add document" });
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await ExtraDocument.findByPk(req.params.id);
    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }
    await document.destroy();
    res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    logger.error("Error while deleting company document", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete document" });
  }
};

exports.takeActionOnCompany = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    company.isBlock = !company.isBlock;
    company.save();

    logger.info(
      `Company ID ${company.id} is now ${
        company.isBlock ? "blocked" : "unblocked"
      }`,
      {
        actionBy: req.user?.id || "Unknown", // Who is taking the action (Admin/PlatformUser?)
        companyId: company.id,
        action: company.isBlock ? "Blocked" : "Unblocked",
      }
    );

    res.status(200).json({
      message: `Company now can ${
        company.isBlock ? "not" : ""
      } perform actions`,
      data: company.isBlock,
      success: true,
    });
  } catch (error) {
    logger.error("Error while taking action on company", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to perform action" });
  }
};

exports.updateCompany = async (req, res, next) => {
  const {
    licenseNumber,
    panNumber,
    gstNumber,
    tanNumber,
    taxIdentificationNumber,
    dinNumber,
    accountNumber,
    ifscCode,
    primaryContactPersonName,
    primaryEmail,
    primaryPhoneNumber,
    password,
    ...rest
  } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(req.params.id, { transaction });

    if (!company) {
      transaction.rollback();
      res.status(400).json({ success: false, message: "Company not found" });
    }

    const existingUser = await User.findOne(
      {
        where: {
          mobileNumber: primaryPhoneNumber,
          id: { [Op.ne]: company.userId },
        },
      },
      { transaction }
    );

    if (existingUser) {
      transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Primary phone number is already exists",
      });
    }

    if (primaryEmail) {
      const existingEmailUser = await User.findOne(
        { where: { email: primaryEmail, id: { [Op.ne]: company.userId } } },
        { transaction }
      );

      if (existingEmailUser) {
        transaction.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Primary email is already exists" });
      }
    }

    company.licenseNumber = licenseNumber
      ? encryptSensitiveData(licenseNumber)
      : company.licenseNumber;

    company.panNumber = panNumber
      ? encryptSensitiveData(panNumber)
      : company.panNumber;

    company.gstNumber = gstNumber
      ? encryptSensitiveData(gstNumber)
      : company.gstNumber;

    company.tanNumber = tanNumber
      ? encryptSensitiveData(tanNumber)
      : company.tanNumber;

    company.taxIdentificationNumber = taxIdentificationNumber
      ? encryptSensitiveData(taxIdentificationNumber)
      : company.taxIdentificationNumber;

    company.dinNumber = dinNumber
      ? encryptSensitiveData(dinNumber)
      : company.dinNumber;

    company.accountNumber = accountNumber
      ? encryptSensitiveData(accountNumber)
      : company.accountNumber;

    company.ifscCode = ifscCode
      ? encryptSensitiveData(ifscCode)
      : company.ifscCode;

    const user = await User.findByPk(company.userId, { transaction });

    if (!user) {
      transaction.rollback();
      res.status(400).json({ success: false, message: "User not found" });
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;

    user.name = primaryContactPersonName || user.name;
    user.email = primaryEmail || user.email;
    user.mobileNumber = primaryPhoneNumber || user.mobileNumber;
    user.password = hashedPassword || user.password;

    await user.save({ transaction });
    await company.update({
      ...company.toJSON(),
      ...rest,
    });

    transaction.commit();
    res
      .status(200)
      .json({ success: true, message: "Company details updated successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while updating company details", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update company" });
  }
};

exports.addManager = async (req, res, next) => {
  const { name, email, mobileNumber, role, password } = req.body;

  if (!validatePassword(password)) {
    return req.status(400).json({ success: false, message: validatePassword });
  }

  if (!["productManager", "orderManager", "warrantyManager"].includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide valid role" });
  }

  try {
    const existingUser = await User.findOne({
      where: {
        mobileNumber,
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is already exists" });
    }

    if (email) {
      const existingEmailUser = await User.findOne({
        where: {
          email,
        },
      });

      if (existingEmailUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      role,
      email: email || null,
      mobileNumber,
      password: hashedPassword,
      verified: true,
      addedBy: req.user.id,
      companyId: req.user.companyId,
    });

    user.password = "";

    res.status(201).json({
      success: true,
      message: "User register successsfully",
      data: user,
    });
  } catch (error) {
    logger.error("Error while adding manager", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: true, message: "Failed to register" });
  }
};

exports.login = async (req, res, next) => {
  const { mobileNumber, password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        mobileNumber,
      },
      attributes: ["id", "mobileNumber", "role", "password"],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number or password.",
      });
    }

    let payload = { id: user.id, role: user.role };

    if (user.role === "companyUser") {
      const companies = await Company.findAll({
        where: {
          userId: user.id,
        },
        attributes: ["id", "companyName"],
      });

      if (companies.length > 1) {
        const token = jwt.sign(payload, jwt_secret, {
          expiresIn: "1d",
        });
        return res.status(200).json({
          message: "Found many choose one!!",
          success: true,
          data: {
            token,
            role: user.role,
            companies,
          },
        });
      } else {
        payload["companyId"] = companies[0].id;
      }
    }

    let storeType;
    if (payload.role === "store") {
      storeType = await getStoreType(payload.id);
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: { token: accessToken, role: user.role, storeType },
    });
  } catch (error) {
    logger.error("Error while processing user login", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to login" });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken)
    return res
      .status(401)
      .json({ success: false, message: "No refresh token provided" });

  try {
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken },
    });

    if (
      !storedToken ||
      storedToken.isRevoked ||
      storedToken.expiresAt < new Date()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const payload = jwt.verify(refreshToken, refresh_jwt_secret);

    // Invalidate old token
    storedToken.isRevoked = true;
    await storedToken.save();

    const newPayload = { id: payload.id, role: payload.role };

    if (payload.role === "companyUser") {
      newPayload["companyId"] = payload.companyId;
    }

    let storeType;
    if (payload.role === "store") {
      storeType = await getStoreType(payload.id);
    }

    const accessToken = generateAccessToken(newPayload);
    const refreshTokenString = generateRefreshToken(newPayload);

    await RefreshToken.create({
      token: refreshTokenString,
      userId: payload.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.cookie("refreshToken", refreshTokenString, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      token: accessToken,
      role: payload.role,
      storeType,
    });
  } catch (error) {
    logger.error("Error while processing refresh token", {
      error: error.message,
      stack: error.stack,
    });
    return res
      .status(403)
      .json({ success: false, message: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token: refreshToken } }
    );
  }

  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const id = req.user.id;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Old and new password are required" });
  }

  const result = validatePassword(newPassword);
  if (result !== true) {
    return res.status(400).json({ success: false, message: result });
  }

  try {
    const user = await User.findOne({
      where: { id },
      attributes: ["id", "password"],
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid old password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    logger.error("Error while processing update password", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to update password" });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const result = await sendForgotPasswordOTP(mobileNumber);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const result = await verifyOTP(mobileNumber, otp);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { mobileNumber, otp, newPassword } = req.body;
    const result = await resetPassword(mobileNumber, otp, newPassword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// exports.chooseCompany = async (req, res, next) => {
//   const { companyId } = req.body;
//   try {
//     const company = await Company.findByPk(companyId);
//     if (!company) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Company not found" });
//     }

//     const user = await User.findByPk(req.user.id);

//     if (!user) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User not found" });
//     }

//     const token = jwt.sign(
//       { id: user.id, role: user.role, companyId },
//       jwt_secret,
//       { expiresIn: "1d" }
//     );

//     res
//       .status(200)
//       .json({ success: true, data: { role: "companyUser", token } });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Fialed to login with company" });
//   }
// };

// exports.verifyOtp = async (req, res, next) => {
//   const { token, otp } = req.body;

//   try {
//     const decoded = jwt.verify(token, jwt_secret);
//     const user = await UnveriefiedUser.findOne({ where: { id: decoded.id } });
//     if (otp === user.verificationToken) {
//       const verifiedUser = User.create({
//         name: user.name,
//         email: user.email || null,
//         password: user.password,
//         role: "customer",
//         mobileNumber: user.mobileNumber,
//         verified: true,
//       });

//       verifiedUser.password = "";

//       await UnveriefiedUser.destroy();

//       return res
//         .status(200)
//         .json({ message: "User verified successfully", verifiedUser });
//     }

//     res.status(400).json({ error: "Invalid or expired OTP" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to verify otp" });
//   }
// };

// exports.resendOtp = async (req, res, next) => {
//   const { token } = req.body;

//   const decoded = await jwt.verify(token, jwt_secret);

//   try {
//     const UnveriefiedUser = await UnveriefiedUser.findByPk(decoded.id);
//     if (!UnveriefiedUser) {
//       return res.status(400).json({ error: "Token is expired or missing" });
//     }
//     const otp = generateOTP();

//     await sendOTP(UnveriefiedUser.mobileNumber, otp);

//     UnveriefiedUser.verificationToken = otp;

//     await UnveriefiedUser.save();

//     const token = jwt.sign({ id: UnveriefiedUser.id }, jwt_secret);

//     res
//       .status(200)
//       .json({ success: true, message: "OTP send successfully", data: token });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to send OTP", details: error.message });
//   }
// };

// exports.addCompany = async (req, res, next) => {
//   const {
//     companyName,
//     registrationNumber,
//     address,
//     city,
//     state,
//     companyUserId,
//   } = req.body;

//   try {
//     const company = await Company.create({
//       companyName,
//       registrationNumber,
//       address,
//       city,
//       state,
//       userId: companyUserId,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Company register successfully",
//       data: company,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to register company" });
//   }
// };
