const {
  Store,
  User,
  OrderProduct,
  OrderItem,
  Order,
  Product,
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../models").sequelize;

const {
  encryptSensitiveData,
  decryptSensitiveData,
  getDecryptedDocumentAsBase64,
} = require("../utils/cryptography");
const bcrypt = require("bcrypt");

const { validatePassword } = require("../middlewares/validations");
const logger = require("../utils/logger");
const { getCompanyOwnStore } = require("../services/AuthService");

const validateUserData = async (email, mobileNumber, userId = null) => {
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

exports.createStore = async (req, res) => {
  const {
    name,
    email,
    mobileNumber,
    storeType,
    industryType,
    comments,
    liscenseNumber,
    taxIdentificationNumber,
    city,
    district,
    state,
    postalCodes,
    country,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    pinCode,
    street,
    baseAddress,
    upiCode: upiId,
    password,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    if (storeType === "companyOwnStore") {
      const storeIds = await getCompanyOwnStore(req.user.companyId);

      if (storeIds && storeIds.length > 0) {
        return res
          .status(400)
          .json({ message: "Company can have only one company own store" });
      }
    }

    const isExists = await validateUserData(email, mobileNumber);
    if (isExists) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number already exists",
      });
    }

    if (storeType !== "companyOwnStore" && storeType !== "thirdPartyStore") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Store Type" });
    }

    // Hash the password
    if (validatePassword(password) !== true) {
      return res
        .status(400)
        .json({ success: false, message: validatePassword(password) });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Encrypt sensitive fields
    const encryptedData = {
      accountNumber: encryptSensitiveData(accountNumber),
      ifscCode: encryptSensitiveData(ifscCode),
      liscenseNumber: encryptSensitiveData(liscenseNumber),
      taxIdentificationNumber: encryptSensitiveData(taxIdentificationNumber),
    };

    // Handle file uploads (assuming files are sent in the request)
    const businessLicense = req.files["businessLiscense"]?.[0];
    const panCard = req.files["panCard"]?.[0] || null;
    const qrCode = req.files["qrCode"]?.[0];

    if (!businessLicense || !qrCode) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Missing required files." });
    }

    const encryptedBusinessLicense = encryptSensitiveData(
      `data:${
        businessLicense.mimetype
      };base64,${businessLicense.buffer.toString("base64")}`
    );
    const encryptedPanCard = panCard
      ? encryptSensitiveData(
          `data:${panCard.mimetype};base64,${panCard.buffer.toString("base64")}`
        )
      : null;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      role: "store",
      addedBy: req.user.id,
      companyId: req.user.companyId,
    });

    const store = await Store.create(
      {
        storeType,
        industryType,
        comments,
        city,
        district,
        state,
        postalCodes: storeType === "companyOwnStore" ? [] : postalCodes,
        country: "India",
        businessLiscense: encryptedBusinessLicense,
        panCard: encryptedPanCard,
        bankName,
        branchName,
        upiId,
        qrCode,
        qrCodeContentType: qrCode.mimetype,
        userId: user.id,
        pinCode,
        street,
        baseAddress,
        companyId: req.user.companyId,
        ...encryptedData,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: {
        id: store.id,
        storeType: store.storeType,
        name: user.name,
        email: user.email,
        city: store.city,
        userId: user.id,
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while creating store", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to create store" });
  }
};

exports.getStores = async (req, res) => {
  const { page = 1, limit = 10, searchTerm = "" } = req.query;

  try {
    const offset = (page - 1) * limit;

    const { count, rows: stores } = await Store.findAndCountAll({
      where: {
        [Op.or]: [
          { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
          { city: { [Op.like]: `%${searchTerm}%` } },
        ],
        companyId: req.user.companyId,
      },
      attributes: ["id", "city", "storeType", "liscenseNumber", "priceRule"],
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "mobileNumber"],
          as: "user",
        },
      ],
      offset,
      limit: parseInt(limit),
    });

    // Map the stores to include the count of `storepricerules`
    const data = stores.map((store) => ({
      id: store.id,
      name: store.user?.name || null,
      email: store.user?.email || null,
      mobileNumber: store.user?.mobileNumber || null,
      userId: store.user?.id || null,
      city: store.city,
      priceRule: store.priceRule,
      liscenseNumber: decryptSensitiveData(store.liscenseNumber),
      storeType: store.storeType,
    }));

    const totalPages = Math.ceil(count / limit);

    // Send response
    res.status(200).json({
      success: true,
      data,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Error while feching stores", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to fetch stores" });
  }
};

exports.getStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await Store.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "mobileNumber"],
          as: "user",
        },
      ],
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    if (store.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this store",
      });
    }

    const decryptedData = {
      accountNumber: decryptSensitiveData(store.accountNumber),
      ifscCode: decryptSensitiveData(store.ifscCode),
      liscenseNumber: decryptSensitiveData(store.liscenseNumber),
      taxIdentificationNumber: decryptSensitiveData(
        store.taxIdentificationNumber
      ),
    };

    const descryptedFiles = {
      businessLiscense: getDecryptedDocumentAsBase64(store.businessLiscense),
      panCard: store.panCard
        ? getDecryptedDocumentAsBase64(store.panCard)
        : null,
    };

    const qrCodeBase64 = `data:${
      store.qrCodeContentType
    };base64,${store.qrCode.toString("base64")}`;

    res.status(200).json({
      success: true,
      data: {
        ...store.toJSON(),
        name: store.user.name,
        email: store.user.email,
        mobileNumber: store.user.mobileNumber,
        userId: store.user.id,
        postalCodes: store.postalCodes.join(","),
        ...decryptedData,
        ...descryptedFiles,
        qrCode: qrCodeBase64,
      },
    });
  } catch (error) {
    logger.error("Error while feching store details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to fetch store" });
  }
};

exports.updateStore = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    mobileNumber,
    storeType,
    industryType,
    comments,
    city,
    state,
    district,
    postalCodes,
    country,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
    upiId,
    liscenseNumber,
    taxIdentificationNumber,
    pinCode,
    street,
    baseAddress,
    password,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const store = await Store.findByPk(id, { transaction });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    if (store.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this store",
      });
    }

    const duplicateCheck = await validateUserData(
      email,
      mobileNumber,
      store.userId
    );

    if (duplicateCheck) {
      return res.status(400).json({
        success: false,
        message: "Email or Mobile Number already exists",
      });
    }

    if (storeType !== "companyOwnStore" && storeType !== "thirdPartyStore") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Store Type" });
    }

    // Encrypt sensitive fields if updated
    const encryptedData = {
      accountNumber: accountNumber
        ? encryptSensitiveData(accountNumber)
        : store.accountNumber,
      ifscCode: ifscCode ? encryptSensitiveData(ifscCode) : store.ifscCode,
      liscenseNumber: liscenseNumber
        ? encryptSensitiveData(liscenseNumber)
        : store.liscenseNumber,
      taxIdentificationNumber: taxIdentificationNumber
        ? encryptSensitiveData(taxIdentificationNumber)
        : store.taxIdentificationNumber,
    };

    // Handle file uploads (assuming files are sent in the request)
    const businessLicense = req.files["businessLiscense"]?.[0];
    const panCard = req.files["panCard"]?.[0] || null;
    const qrCode = req.files["qrCode"]?.[0];

    const encryptedBusinessLicense = businessLicense
      ? encryptSensitiveData(
          `data:${
            businessLicense.mimetype
          };base64,${businessLicense.buffer.toString("base64")}`
        )
      : store.businessLiscense;

    const encryptedPanCard = panCard
      ? encryptSensitiveData(
          `data:${panCard.mimetype};base64,${panCard.buffer.toString("base64")}`
        )
      : store.panCard;

    const userData = {
      name,
      email,
      mobileNumber,
    };

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    await User.update(userData, {
      where: {
        id: store.userId,
      },
      transaction,
    });

    await store.update(
      {
        storeType,
        industryType,
        comments,
        city,
        state,
        district,
        postalCodes,
        country: "India",
        bankName,
        branchName,
        pinCode,
        street,
        baseAddress,
        upiId,
        ...encryptedData,
        businessLicense: encryptedBusinessLicense,
        panCard: encryptedPanCard,
        qrCode: qrCode?.buffer || store.qrCode,
        qrCodeContentType: qrCode?.mimetype || store.qrCodeContentType,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Store updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    logger.error("Error while updating store", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to update store" });
  }
};

exports.deleteStore = async (req, res) => {
  const { id } = req.params;

  // Start a database transaction
  const transaction = await sequelize.transaction();

  try {
    // Find the store by its ID
    const store = await Store.findByPk(id, { transaction });

    if (!store) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    // Get the associated user ID
    const userId = store.userId;

    // Delete the store
    await store.destroy({ transaction });

    // Check and delete the associated user
    const user = await User.findByPk(userId, { transaction });
    if (user) {
      await user.destroy({ transaction });
    }

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Store and associated user deleted successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while deleting store", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete store. Please try again later.",
    });
  }
};

exports.getCustomers = async (req, res) => {
  const storeId = req.params.storeId;
  let { page = 1, limit = 10, searchTerm = "" } = req.query;

  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  }

  const offset = (page - 1) * limit;
  const whereClause = { "$orderItem.storeId$": storeId };

  if (searchTerm && searchTerm.trim() !== "") {
    whereClause[Op.or] = [
      { "$orderItem.order.customer.name$": { [Op.like]: `%${searchTerm}%` } },
      { "$product.productName$": { [Op.like]: `%${searchTerm}%` } },
    ];
  }

  try {
    const { rows: customers, count } = await OrderProduct.findAndCountAll({
      where: whereClause,
      attributes: ["quantity"],
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "createdAt"],
          include: [
            {
              model: Order,
              as: "order",
              include: [
                {
                  model: User,
                  as: "customer",
                  attributes: ["name", "email"],
                },
              ],
            },
          ],
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
        },
      ],
      limit: parseInt(limit, 10),
      offset: offset,
    });

    const data = customers.map((customer) => ({
      orderId: customer.orderItem.id,
      name: customer.orderItem.order.customer.name,
      email: customer.orderItem.order.customer.email,
      productName: customer.product.productName,
      quantity: customer.quantity,
      orderDate: customer.orderItem.createdAt.toLocaleDateString(),
    }));

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          total: count,
          currentPage: parseInt(page),
          totalPages,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error while getting customers", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get customers.",
    });
  }
};

exports.getStoreDetails = async (req, res) => {
  const storeId = req.params.storeId;

  try {
    const store = await User.findOne({
      attributes: ["name", "email", "mobileNumber"],
      where: { id: storeId },
      include: [
        {
          model: Store,
          as: "store",
          attributes: [
            "pinCode",
            "street",
            "baseAddress",
            "city",
            "district",
            "state",
            "country",
            "businessLiscense",
            "panCard",
            "liscenseNumber",
          ],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const data = {
      name: store.name,
      email: store.email,
      mobileNumber: store.mobileNumber,
      pinCode: store.store.pinCode,
      street: store.store.street,
      baseAddress: store.store.baseAddress,
      city: store.store.city,
      district: store.store.district,
      state: store.store.state,
      country: store.store.country,
      liscenseNumber: decryptSensitiveData(store.store.liscenseNumber),
      panCard: getDecryptedDocumentAsBase64(store.store.panCard),
      businessLiscense: getDecryptedDocumentAsBase64(
        store.store.businessLiscense
      ),
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while feching store details", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get store details." });
  }
};
