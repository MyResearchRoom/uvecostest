const { Op, Sequelize, fn, col, literal } = require("sequelize");
const {
  Product,
  Company,
  ProductImage,
  ProductCategory,
  ProductSubCategory,
  Section,
  Table,
  Pricerule,
  Wishlist,
  Cart,
  StoreProductStock,
  sequelize,
} = require("../models");

const distributorService = require("../services/distributorService");
const storeService = require("../services/storeService");
const { getReviewStats } = require("../services/reviewService");
const {
  isWishlisted,
  getWishlistedProductIds,
} = require("../services/wishlistService");
const { getCartItem } = require("../services/cartService");
const { getOneProductImage } = require("../services/productService");
const logger = require("../utils/logger");

const getFinalPrice = (originalPrice, gst, discount) => {
  const gstv = originalPrice * (gst / 100);
  const discountedPrice = originalPrice - originalPrice * (discount / 100);
  return parseInt(discountedPrice + gstv);
};

const getDiscountAmount = (originalPrice, discount) =>
  originalPrice * (discount / 100);

const calculatePriceWithGST = (price, gst) =>
  parseInt(price) + parseInt((price / 100) * gst);

const calculateDiscountedPrice = (price, gst, discount) =>
  !discount
    ? calculatePriceWithGST(price, gst)
    : getFinalPrice(price, gst, discount);

exports.addProduct = async (req, res, next) => {
  const {
    productName,
    productCategoryId,
    productSubCategoryId,
    description,
    warranty,
    brandName,
    soldBy,
    returnOption,
    displayType,
    deliveryMode,
    keywords,
    shippingCost,
    isTopDeal,
    specifications = [],
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const company = await Company.findByPk(req.user.companyId, { transaction });
    if (!company) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Company not found, Please (re)login, & try again",
      });
    }

    const images = req.files["images[]"];
    const video = req.files["video"];

    if (!images || images.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "At least one image is required" });
    }

    if (images.length > 7) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 7 images",
      });
    }

    if (video && video.length > 1) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "You can only provide 1 video" });
    }

    const videoBuffer = video && video[0] ? video[0].buffer : null;
    const videoContentType = video && video[0] ? video[0].mimetype : null;

    const product = await Product.create(
      {
        productName,
        productCategoryId,
        productSubCategoryId,
        description,
        warranty,
        brandName,
        soldBy,
        returnOption: returnOption || 0,
        displayType,
        deliveryMode,
        keywords,
        shippingCost,
        isTopDeal: isTopDeal ? 1 : 0,
        video: videoBuffer,
        videoContentType,
        companyId: req.user.companyId,
      },
      { transaction }
    );

    const productImagesData = images.map((img) => ({
      image: img.buffer,
      contentType: img.mimetype,
      productId: product.id,
    }));

    await ProductImage.bulkCreate(productImagesData, { transaction });

    for (const section of specifications) {
      const { sectionTitle, specifications } = section;

      const createdSection = await Section.create(
        {
          sectionTitle,
          productId: product.id,
        },
        { transaction }
      );

      const specificationsData = specifications.map((spec) => ({
        sectionId: createdSection.id,
        informationTitle: spec.informationTitle,
        information: spec.information,
      }));

      await Table.bulkCreate(specificationsData, { transaction });
    }

    await transaction.commit();

    logger.info("A new product has been created", {
      actionBy: req.user.id,
      productId: product.id,
    });

    res.status(201).json({
      message: "Product added successfully with specifications",
      data: product,
      success: true,
    });
  } catch (error) {
    console.log(error);

    if (transaction) await transaction.rollback();
    logger.error("Error while adding product", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Failed to add product",
      success: false,
    });
  }
};

exports.sendForApproval = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
      },
      attributes: ["id", "isBlock", "companyId"],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    product.isBlock = "pending";

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product successfully send for approval.",
    });
  } catch (error) {
    console.log(error);
    logger.error("Error while sending product for approval", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Failed to send product for approval",
      success: false,
    });
  }
};

exports.getProducts = async (req, res, next) => {
  const {
    status,
    searchTerm,
    page = 1,
    limit = 10,
    category,
    price,
  } = req.query;

  const name = req.body.name;
  const whereClause = {
    companyId: req.user.companyId,
    deletedAt: {
      [Op.eq]: null,
    },
  };

  const storeClause = {};
  if (req.user.role === "store") {
    storeClause.storeId = req.user.id;
  } else {
    storeClause.storeId = null;
    storeClause.companyId = req.user.companyId;
  }

  if (["pending", "rejected", "approved"].includes(status)) {
    whereClause.isBlock = status;
  }

  if (searchTerm && searchTerm !== "") {
    whereClause[Op.or] = [
      {
        productName: {
          [Op.like]: `%${searchTerm}%`,
        },
      },
      {
        "$category.name$": {
          [Op.like]: `%${searchTerm}%`,
        },
      },
      {
        "$subCategory.name$": {
          [Op.like]: `%${searchTerm}%`,
        },
      },
    ];
  }

  if (!isNaN(category) && category !== "") {
    whereClause["$category.id$"] = category;
  }

  if (price === "not-set") {
    whereClause.originalPrice = {
      [Op.eq]: null,
    };
  }

  if (price === "set") {
    whereClause.originalPrice = {
      [Op.not]: null,
    };
  }

  const includes = [
    {
      model: ProductCategory,
      as: "category",
      attributes: ["id", "name"],
    },
    {
      model: ProductSubCategory,
      as: "subCategory",
      attributes: ["id", "name"],
    },
    {
      model: StoreProductStock,
      as: "stock",
      attributes: ["stockLevel", "stockThresholdLevel"],
      where: storeClause,
      required: false,
    },
  ];

  const orderCause = [["createdAt", "DESC"]];

  if (name) {
    includes.push({
      model: Pricerule,
      as: "pricerules",
      attributes: ["priceValue"],
    });
    orderCause.unshift([
      sequelize.literal(
        `(SELECT priceValue 
         FROM price_rules 
         WHERE price_rules.productId = Product.id 
           AND price_rules.name = '${name}' 
         LIMIT 1)`
      ),
      "DESC",
    ]);
  }

  const offset = (page - 1) * limit;

  try {
    const { rows: products, count: productCount } =
      await Product.findAndCountAll({
        where: whereClause,
        attributes: [
          "id",
          "productName",
          "productStatus",
          "description",
          "isBlock",
          "block",
          "gst",
          "originalPrice",
          "handlingCharges",
          "otherCharges",
          "shippingCharges",
          "shipping",
          "createdAt",
          "mrp",
          "discount",
          "cod",
          "height",
          "weight",
          "width",
          "length",
          [
            sequelize.literal(
              "ROUND((`Product`.`originalPrice` + (`Product`.`originalPrice` * `Product`.`gst` / 100)), 2)"
            ),
            "totalAmount",
          ],
          [
            sequelize.literal(
              `(SELECT priceValue 
               FROM price_rules 
               WHERE price_rules.productId = Product.id 
                 AND price_rules.name = '${name}' 
               LIMIT 1)`
            ),
            "priceValue",
          ],
        ],
        include: includes,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: orderCause,
      });

    const transformedProducts = products.map((product) => ({
      id: product.id,
      productName: product.productName,
      category: product.category,
      subCategory: product.subCategory,
      stockLevel: product.stock?.stockLevel,
      stockThresholdLevel: product.stock?.stockThresholdLevel,
      productStatus: product.productStatus,
      description: product.description,
      gst: product.gst,
      isBlock: product.isBlock,
      originalPrice: product.originalPrice,
      warranty: product.warranty,
      handlingCharges: product.handlingCharges,
      shippingCharges: product.shippingCharges,
      otherCharges: product.otherCharges,
      shipping: product.shipping,
      createdAt: product.createdAt?.toLocaleDateString(),
      priceValue: product.get("priceValue"),
      mrp: product.mrp,
      discount: product.discount,
      cod: product.cod,
      height: product.height,
      weight: product.weight,
      width: product.width,
      length: product.length,
    }));

    // Return paginated response
    res.status(200).json({
      data: transformedProducts,
      pagination: {
        count: productCount,
        totalPages: Math.ceil(productCount / limit),
        currentPage: parseInt(page),
      },
      success: true,
    });
  } catch (error) {
    logger.error("Error while feching products", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Failed to get products", success: false });
  }
};

exports.getProductImages = async (req, res, next) => {
  const productId = req.params.productId;

  try {
    const productImages = await ProductImage.findAll({
      where: {
        productId,
      },
    });

    const images = productImages.map((image) => ({
      id: image.id,
      image: `data:${image.contentType};base64,${image.image.toString(
        "base64"
      )}`,
    }));
    res.status(200).json({ data: images, success: true });
  } catch (error) {
    logger.error("Error while feching product images", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "Failed to get product images", success: false });
  }
};

exports.updateProduct = async (req, res, next) => {
  const { id: productId } = req.params;
  const {
    productName,
    productCategoryId,
    productSubCategoryId,
    description,
    warranty,
    brandName,
    soldBy,
    returnOption,
    displayType,
    deliveryMode,
    keywords,
    shippingCost,
    specifications = [], // Array of sections with specifications
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Check if product exists
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.companyId !== req.user.companyId) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (product.isBlock === "pending") {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Product is pending and cannot be updated",
      });
    }

    // Validate images and video (if provided)
    const images = req.files?.["images[]"];
    const video = req.files?.["video"];

    if (images && images.length > 7) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 7 images",
      });
    }

    if (video && video.length > 1) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "You can only provide 1 video" });
    }

    const videoBuffer = video && video[0] ? video[0].buffer : null;
    const videoContentType = video && video[0] ? video[0].mimetype : null;
    if (productName) product.productName = productName;
    if (productCategoryId) product.productCategoryId = productCategoryId;
    if (productSubCategoryId)
      product.productSubCategoryId = productSubCategoryId;
    if (description) product.description = description;
    if (warranty) product.warranty = warranty;
    if (brandName) product.brandName = brandName;
    if (soldBy) product.soldBy = soldBy;
    if (returnOption) product.returnOption = returnOption;
    if (displayType) product.displayType = displayType;
    if (deliveryMode) product.deliveryMode = deliveryMode;
    if (keywords) product.keywords = keywords;
    if (shippingCost) product.shippingCost = shippingCost;
    if (videoBuffer) {
      product.video = videoBuffer;
      product.videoContentType = videoContentType;
    }
    product.isBlock = "drafted";
    await product.save({ transaction });

    // Replace images if provided
    if (images && images.length > 0) {
      // Delete old images
      // await ProductImage.destroy({ where: { productId }, transaction });

      // Add new images
      const productImagesData = images.map((img) => ({
        image: img.buffer,
        contentType: img.mimetype,
        productId: product.id,
      }));
      await ProductImage.bulkCreate(productImagesData, { transaction });
    }

    // Update specifications
    if (specifications && specifications.length > 0) {
      // Delete old sections and their specifications
      const oldSections = await Section.findAll({
        where: { productId },
        transaction,
      });
      const sectionIds = oldSections.map((section) => section.id);

      await Table.destroy({
        where: {
          sectionId: {
            [Op.in]: sectionIds,
          },
        },
        transaction,
      });
      await Section.destroy({ where: { productId }, transaction });

      // Insert new specifications
      for (const section of specifications) {
        const { sectionTitle, specifications } = section;

        // Create a new section
        const createdSection = await Section.create(
          {
            sectionTitle,
            productId: product.id,
          },
          { transaction }
        );

        // Create specifications for the section
        const specificationsData = specifications.map((spec) => ({
          sectionId: createdSection.id,
          informationTitle: spec.informationTitle,
          information: spec.information,
        }));

        await Table.bulkCreate(specificationsData, { transaction });
      }
    }

    // Commit transaction
    await transaction.commit();

    logger.info("A product has been updated", {
      actionBy: req.user.id,
      productId,
    });

    res.status(200).json({
      message: "Product updated successfully",
      data: product,
      success: true,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error while updating product", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Failed to update product",
      success: false,
    });
  }
};

exports.getProductsForApproval = async (req, res, next) => {
  const { searchTerm, status, page = 1, pageSize = 10 } = req.query;
  const limit = parseInt(pageSize, 10) || 10;
  const offset = (parseInt(page, 10) - 1) * limit;

  const whereClause = {
    ...(searchTerm &&
      searchTerm.trim() && {
        [Op.or]: [
          { "$company.companyName$": { [Op.like]: `%${searchTerm}%` } },
          { "$category.name$": { [Op.like]: `%${searchTerm}%` } },
        ],
      }),
    "$Product.isBlock$": { [Op.ne]: "rejected" },
  };

  let statuses = "";
  if (status === "approved") statuses = "approved";
  else if (status === "pendingApproval") statuses = "pending";
  else statuses = "pending,approved";
  try {
    const { rows: productsData, count: totalRecords } =
      await Product.findAndCountAll({
        where: whereClause,
        attributes: [
          "companyId",
          "productCategoryId",
          [
            Sequelize.fn("DATE", Sequelize.col("Product.createdAt")),
            "createdAt",
          ],
          [Sequelize.fn("COUNT", Sequelize.col("Product.id")), "productCount"],
          [
            Sequelize.fn(
              "GROUP_CONCAT",
              Sequelize.literal(
                "DISTINCT Product.isBlock ORDER BY Product.isBlock ASC"
              )
            ),
            "status",
          ],
          [Sequelize.col("category.name"), "productCategoryName"],
          [Sequelize.col("company.companyName"), "companyName"],
        ],
        include: [
          {
            model: ProductCategory,
            as: "category",
            attributes: [],
          },
          {
            model: Company,
            as: "company",
            attributes: [],
          },
        ],
        group: [
          "companyId",
          "productCategoryId",
          Sequelize.fn("DATE", Sequelize.col("Product.createdAt")),
          "category.name",
          "company.companyName",
        ],
        having: status
          ? Sequelize.literal(
              `GROUP_CONCAT(DISTINCT Product.isBlock ORDER BY Product.isBlock ASC) = '${statuses}'`
            )
          : undefined,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

    const tableData = productsData.map((product) => {
      const productStatuses = product.get("status");

      let derivedStatus = "partiallyApproved";
      if (productStatuses === "pending") derivedStatus = "pendingApproval";
      else if (productStatuses === "approved") derivedStatus = "approved";

      return {
        groupKey: `${product.companyId}-${product.productCategoryId}-${new Date(
          product.createdAt
        ).getTime()}`,
        id: product.companyId,
        companyName: product.get("companyName"),
        productCategory: product.get("productCategoryName"),
        count: product.get("productCount"),
        createdAt: new Date(product.get("createdAt")).toLocaleDateString(
          "en-GB"
        ),
        status: derivedStatus,
      };
    });

    res.status(200).json({
      success: true,
      data: tableData,
      pagination: {
        totalRecords: totalRecords.length,
        totalPages: Math.ceil(totalRecords.length / limit),
        currentPage: parseInt(page, 10),
        pageSize: limit,
      },
    });
  } catch (error) {
    logger.error("Error while feching products for approval", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product data" });
  }
};

exports.getProductsByKey = async (req, res, next) => {
  const { key } = req.params;
  const status = req.body.status;

  const [companyId, productCategoryId, timestamp] = key.split("-");

  const dateFilter = new Date(parseInt(timestamp));

  const whereClause = {
    companyId: parseInt(companyId, 10),
    createdAt: {
      [Op.between]: [
        dateFilter.setHours(0, 0, 0, 0),
        dateFilter.setHours(23, 59, 59, 999),
      ],
    },
    deletedAt: {
      [Op.eq]: null,
    },
  };

  if (status !== "approved") {
    whereClause.isBlock = {
      [Op.ne]: "approved",
    };
  } else {
    whereClause.isBlock = {
      [Op.eq]: "approved",
    };
  }

  try {
    const includeOptions = [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "image", "contentType", "createdAt"],
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "companyName"],
      },
    ];

    if (productCategoryId) {
      includeOptions.push({
        model: ProductCategory,
        as: "category",
        attributes: ["id", "name"],
        where: {
          id: parseInt(productCategoryId, 10),
        },
      });
    }

    const products = await Product.findAll({
      where: whereClause,
      attributes: [
        "id",
        "productName",
        "stockLevel",
        "isBlock",
        "block",
        "description",
        "createdAt",
      ],
      include: includeOptions,
    });

    // Map the products into the desired format
    const data = products.map((product) => ({
      id: product.id,
      productName: product.productName,
      stockLevel: product.stockLevel,
      isBlock: product.isBlock,
      block: product.block,
      description: product.description,
      category: product.category ? product.category.name : null,
      companyId: product.company.id,
      companyName: product.company.companyName,
      image:
        product.images && product.images.length > 0
          ? `data:${
              product.images[0].contentType
            };base64,${product.images[0].image.toString("base64")}`
          : null,
    }));

    // Send the response
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while feching products", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

exports.approvedProducts = async (req, res, next) => {
  const {
    companyId,
    mainCategoryId,
    subCategoryId,
    categoryId,
    searchTerm,
    page = 1,
    limit = 10,
  } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = { isBlock: "approved" };
  const categoryWhereClause = {};
  if (companyId && !isNaN(companyId)) {
    whereClause.companyId = companyId;
  }
  if (mainCategoryId && !isNaN(mainCategoryId)) {
    categoryWhereClause.mainCategoryId = mainCategoryId;
  }
  if (subCategoryId && !isNaN(subCategoryId)) {
    whereClause.productSubCategoryId = subCategoryId;
  }

  if (categoryId && !isNaN(categoryId)) {
    whereClause.productCategoryId = categoryId;
  }
  if (req.url.startsWith("/public/products")) {
    whereClause.originalPrice = {
      [Op.not]: null,
    };
  }

  if (searchTerm && searchTerm?.trim()?.length > 0) {
    whereClause[Op.or] = [
      { productName: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
    ];
  }

  try {
    const totalProducts = await Product.count({ where: whereClause });
    const products = await Product.findAll({
      where: whereClause,
      attributes: [
        "id",
        "productName",
        "stockLevel",
        "isBlock",
        "block",
        "description",
        "originalPrice",
      ],
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "image", "contentType", "createdAt"],
        },
        {
          model: ProductCategory,
          as: "category",
          attributes: ["id", "name"],
          where: categoryWhereClause,
        },
        {
          model: Company,
          as: "company",
          attributes: ["id", "companyName"],
        },
      ],
      limit: parseInt(limit, 10),
      offset,
    });

    // Map the products into the desired format
    const data = products.map((product) => ({
      id: product.id,
      productName: product.productName,
      stockLevel: product.stockLevel,
      isBlock: product.isBlock,
      block: product.block,
      description: product.description,
      originalPrice: product.originalPrice,
      category: product.category ? product.category.name : null,
      companyId: product.company.id,
      companyName: product.company.companyName,
      image:
        product.images && product.images.length > 0
          ? `data:${
              product.images[0].contentType
            };base64,${product.images[0].image.toString("base64")}`
          : null,
    }));

    const totalPages = Math.ceil(totalProducts / limit);

    // Send the response
    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalRecords: totalProducts,
          totalPages,
          currentPage: parseInt(page, 10),
          pageSize: limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error while feching products", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

exports.takeAction = async (req, res, next) => {
  const { action } = req.body;
  if (action !== "pending" && action !== "approved" && action !== "rejected") {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.isBlock = action;

    await product.save();

    logger.info(`Product has been ${action}`, {
      actionBy: req.user.id,
      productId: product.id,
    });

    res.status(200).json({
      message: `Product is ${
        product.isBlock == "approved"
          ? "Accepted"
          : product.isBlock == "rejected"
          ? "Rejected"
          : "Pending"
      }`,
      success: true,
    });
  } catch (error) {
    logger.error("Error while taking action on product", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to take action" });
  }
};

exports.setPricing = async (req, res, next) => {
  const {
    originalPrice,
    gst,
    handlingCharges,
    otherCharges,
    shippingCharges,
    shipping,
    mrp,
    discount,
    cod,
    height,
    weight,
    width,
    length,
  } = req.body;

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product",
      });
    }

    product.originalPrice = originalPrice;
    product.gst = gst;
    if (handlingCharges) product.handlingCharges = handlingCharges;
    if (otherCharges) product.otherCharges = otherCharges;
    product.shipping = shipping;
    if (shipping === "paid") {
      product.shippingCharges = shippingCharges;
      product.height = height;
      product.weight = weight;
      product.width = width;
      product.length = length;
    } else product.shippingCharges = null;
    product.shipping = shipping;
    product.mrp = mrp;
    product.discount = discount;
    product.cod = cod;

    await product.save();

    logger.info("Product price has been updated", {
      actionBy: req.user.id,
      productId: product.id,
    });
    res
      .status(200)
      .json({ success: true, message: "Pricing updated successfully" });
  } catch (error) {
    logger.error("Error while setting product price", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to set pricE" });
  }
};

exports.setPresence = async (req, res, next) => {
  const { status } = req.body;

  if (status !== true && status !== false) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this product",
      });
    }
    product.productStatus = status;

    await product.save();

    logger.info(
      `Product has been set ${
        product.productStatus == true ? "Active" : "Inactive"
      }`,
      {
        actionBy: req.user.id,
        productId: product.id,
      }
    );

    res.status(200).json({
      success: true,
      message: `Product is ${
        product.productStatus == true ? "Active" : "Inactive"
      }`,
      status: product.productStatus,
    });
  } catch (error) {
    logger.error("Error while setting product presence", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to take action" });
  }
};

exports.deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.user.companyId;

  try {
    const product = await Product.findOne({ where: { id, companyId } });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    await product.destroy();

    logger.info("Product has been deleted", {
      actionBy: req.user.id,
      productId: product.id,
    });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    logger.error("Error while deleting product", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product." });
  }
};

exports.deleteProductImage = async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.user.companyId;

  try {
    const productImage = await ProductImage.findOne({
      where: { id },
      include: [
        {
          model: Product,
          as: "product",
          where: {
            companyId,
          },
        },
      ],
    });

    if (!productImage) {
      return res
        .status(404)
        .json({ success: false, message: "Product image not found." });
    }
    await productImage.destroy();

    logger.info("Product image has been deleted", {
      actionBy: req.user.id,
      productId: productImage.product.id,
      productImageId: productImage.id,
    });

    res
      .status(200)
      .json({ success: true, message: "Product image deleted successfully." });
  } catch (error) {
    logger.error("Error while deleting product image", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete product image.",
    });
  }
};

exports.getProductById = async (req, res, next) => {
  const { id: productId } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    const includes = [
      { model: ProductImage, as: "images" },
      { model: ProductCategory, as: "category", attributes: ["id", "name"] },
      { model: ProductSubCategory, as: "subCategory" },
      {
        model: Section,
        as: "sections",
        include: [{ model: Table, as: "specifications" }],
      },
    ];

    if (userId) {
      includes.push({
        model: Cart,
        as: "cart",
        where: {
          userId,
        },
        required: false,
      });
      includes.push({
        model: Wishlist,
        as: "wishlist",
        where: {
          userId,
        },
        required: false,
      });
      if (role === "distributor") {
        const distributor = await distributorService.getDistributorPriceRule(
          userId
        );

        includes.push({
          model: Pricerule,
          as: "pricerules",
          attributes: ["priceValue"],
          where: {
            name: distributor.priceRule,
          },
          required: false,
        });
      } else if (role === "store") {
        const store = await storeService.getStorePriceRule(userId);

        includes.push({
          model: Pricerule,
          as: "pricerules",
          attributes: ["priceValue"],
          where: {
            name: store.priceRule,
          },
          required: false,
        });
      }
    }

    const reviewStats = await getReviewStats(productId);

    const product = await Product.findByPk(productId, {
      include: includes,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let images = null;

    if (product.images && product.images.length > 0) {
      images = product.images.map((image) => ({
        id: image.id,
        image: `data:${image.contentType};base64,${image.image.toString(
          "base64"
        )}`,
      }));
    }

    if (product.video) {
      product.video = `data:${
        product.videoContentType
      };base64,${product.video.toString("base64")}`;
    }

    let isCarted = false;
    let quantity = 0;

    if (product.cart && product.cart.length > 0) {
      isCarted = true;
      quantity = product.cart[0].quantity;
    }

    let wishlisted = false;

    if (product.wishlist && product.wishlist.length > 0) {
      wishlisted = true;
    }

    const hasDiscount = product.pricerules && product.pricerules.length > 0;
    const discountValue = hasDiscount
      ? parseFloat(product.pricerules[0].priceValue)
      : 0;
    const discountedPrice = calculateDiscountedPrice(
      product.originalPrice,
      product.gst,
      discountValue
    );

    res.status(200).json({
      success: true,
      data: {
        product: {
          ...product.toJSON(),
          originalPrice:
            parseInt(product.originalPrice) +
            parseInt((product.originalPrice / 100) * product.gst),
          isCarted,
          quantity,
          wishlisted,
          hasDiscount,
          specialDiscount: discountValue,
          specialDiscountAmount: getDiscountAmount(
            product.originalPrice,
            discountValue
          ),
          discountedPrice,
          mrp: product.mrp,
          majorDiscount: product.discount,
          majorDiscountAmount: getDiscountAmount(product.mrp, product.discount),
          otherCharges: product.otherCharges || 0,
          shippingCharges: product.shippingCharges || 0,
          handlingCharges: product.handlingCharges || 0,
          stockStatus:
            req.user?.role === "store"
              ? "In Stock"
              : product.stockLevel === 0
              ? "Out of Stock"
              : product.stockLevel < product.stockThresholdLevel
              ? "Low Stock"
              : "In Stock",
          ...reviewStats,
          cart: null,
          images: null,
          pricerules: null,
          wishlist: null,
        },
        images,
      },
    });
  } catch (error) {
    logger.error("Error while feching product details", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get product data" });
  }
};

exports.getProductsByCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    const products = await Product.findAll({
      attributes: ["id", "productName"],
      where: {
        productCategoryId: id,
        companyId: req.user.companyId,
      },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    logger.error("Error while fetching products by category", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ message: "failed to get products by category", success: false });
  }
};

exports.blockAction = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.block = !product.block;
    await product.save();

    logger.info(`Product has been ${product.block ? "block" : "unblock"}`, {
      actionBy: req.user.id,
      productId: product.id,
    });

    res.status(200).json({ success: true, data: product.block });
  } catch (error) {
    logger.error("Error while blocking/unblocking product", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to perform action" });
  }
};

exports.getProductsWithPrice = async (req, res, next) => {
  const whereClause = {};
  if (req.user.role === "store") {
    whereClause.storeId = req.user.id;
  } else {
    whereClause.storeId = null;
    whereClause.companyId = req.user.companyId;
  }
  try {
    const products = await Product.findAll({
      attributes: ["id", "productName", "originalPrice", "gst", "warranty"],
      where: {
        companyId: req.user.companyId,
        block: false,
        isBlock: "approved",
      },
      include: [
        {
          model: StoreProductStock,
          as: "stock",
          attributes: ["stockLevel", "stockThresholdLevel"],
          where: whereClause,
          required: false,
        },
      ],
    });

    const data = products.map((product) => ({
      productId: product.id,
      productName: product.productName,
      originalPrice: product.originalPrice,
      gst: product.gst,
      warranty: product.warranty,
      stockLevel: product.stock?.stockLevel,
      stockThresholdLevel: product.stock?.stockThresholdLevel,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting products", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get products with price" });
  }
};

// exports.getPublicProducts = async (req, res, next) => {
//   const userId = req.user?.id;
//   const role = req.user?.role;

//   const {
//     companyId,
//     mainCategoryId,
//     subCategoryId,
//     categoryId,
//     wishlisted,
//     brands,
//     categories,
//     companyCategories,
//     companySubCategories,
//     minPrice,
//     maxPrice,
//     minDiscount,
//     searchTerm,
//   } = req.query;

//   let page = parseInt(req.query.page) || 1;
//   let limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;

//   const brandNamesArray = brands?.split(",") || [];
//   const categoryIdsArray = categories?.split(",") || [];
//   const companyCategoryIdsArray = companyCategories?.split(",") || [];
//   const companySubCategoryIdsArray = companySubCategories?.split(",") || [];

//   // Get user-specific price rule
//   let userPriceRule = null;
//   if (role === "distributor") {
//     const distributor = await distributorService.getDistributorPriceRule(
//       userId
//     );
//     userPriceRule = distributor?.priceRule || null;
//   } else if (role === "store") {
//     const store = await storeService.getStorePriceRule(userId);
//     userPriceRule = store?.priceRule || null;
//   }

//   const replacements = {
//     offset,
//     limit,
//     userPriceRule,
//     userId,
//     brandNames: brandNamesArray,
//     categoryIds: categoryIdsArray,
//     companyCategoryIds: companyCategoryIdsArray,
//     companySubCategoryIds: companySubCategoryIdsArray,
//     minPrice: parseFloat(minPrice) || 0,
//     maxPrice: parseFloat(maxPrice) || 999999,
//     minDiscount: parseFloat(minDiscount) || 0,
//     searchTerm: `%${searchTerm || ""}%`,
//   };

//   let filterClauses = `
//     p.isBlock = 'approved'
//     AND p.block = false
//     AND p.productStatus = true
//     AND p.originalPrice IS NOT NULL
//   `;

//   if (brandNamesArray.length)
//     filterClauses += ` AND p.brandName IN (:brandNames) `;
//   if (categoryId) filterClauses += ` AND p.productCategoryId = ${categoryId} `;
//   if (subCategoryId)
//     filterClauses += ` AND p.productSubCategoryId = ${subCategoryId} `;
//   if (companyId) filterClauses += ` AND p.companyId = ${companyId} `;
//   if (companyCategoryIdsArray.length)
//     filterClauses += ` AND p.productCategoryId IN (:companyCategoryIds) `;
//   if (companySubCategoryIdsArray.length)
//     filterClauses += ` AND p.companySubCategoryId IN (:companySubCategoryIds) `;

//   if (mainCategoryId)
//     filterClauses += ` AND cat.mainCategoryId = ${mainCategoryId} `;
//   if (categoryIdsArray.length)
//     filterClauses += ` AND cat.mainCategoryId IN (:categoryIds) `;

//   if (searchTerm) {
//     filterClauses += ` AND (
//       p.productName LIKE :searchTerm
//       OR p.description LIKE :searchTerm
//       OR p.brandName LIKE :searchTerm
//     )`;
//   }

//   const baseSelect = `
//     SELECT
//       p.id,
//       p.productName,
//       p.description,
//       p.originalPrice,
//       p.gst,
//       p.stockLevel,
//       p.discount,
//       cat.name AS category,
//       cat.mainCategoryId,
//       COALESCE(pr.priceValue, 0) AS userDiscount,
//       ROUND((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) + ((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) * p.gst / 100), 2) AS final_price
//     FROM products as p
//     LEFT JOIN price_rules as pr ON pr.productId = p.id AND pr.name = :userPriceRule
//     LEFT JOIN product_categories as cat ON cat.id = p.productCategoryId
//     WHERE ${filterClauses}
//     GROUP BY p.id, cat.name, pr.priceValue
//     HAVING final_price BETWEEN :minPrice AND :maxPrice
//     AND COALESCE(pr.priceValue, 0) >= :minDiscount
//     ORDER BY p.id DESC
//     LIMIT :limit OFFSET :offset
//   `;

//   const countQuery = `
//     SELECT COUNT(*) as count
//     FROM (
//       SELECT p.id,
//       p.originalPrice,
//       p.gst,
//       cat.mainCategoryId
//       FROM products as p
//       LEFT JOIN price_rules as pr ON pr.productId = p.id AND pr.name = :userPriceRule
//       LEFT JOIN product_categories as cat ON cat.id = p.productCategoryId
//       WHERE ${filterClauses}
//       GROUP BY p.id, pr.priceValue
//       HAVING ROUND((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) + ((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) * p.gst / 100), 2) BETWEEN :minPrice AND :maxPrice
//       AND COALESCE(pr.priceValue, 0) >= :minDiscount
//     ) AS countResult
//   `;

//   try {
//     const [products] = await sequelize.query(baseSelect, { replacements });
//     const [[{ count }]] = await sequelize.query(countQuery, { replacements });

//     const enrichedProducts = await Promise.all(
//       products.map(async (product) => {
//         const { reviewCount, averageRating } = await getReviewStats(product.id);

//         const wishlisted = userId
//           ? await isWishlisted(userId, product.id)
//           : false;
//         const cartItem = userId ? await getCartItem(userId, product.id) : null;
//         const image = await getOneProductImage(product.id);

//         return {
//           ...product,
//           averageRating,
//           reviewCount,
//           wishlisted: !!wishlisted,
//           isCarted: !!cartItem,
//           quantity: cartItem?.quantity || 0,
//           image,
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         data: enrichedProducts,
//         pagination: {
//           totalItems: count,
//           currentPage: page,
//           itemsPerPage: limit,
//           totalPages: Math.ceil(count / limit),
//         },
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch products" });
//   }
// };

exports.getUniqueBrandNames = async (req, res, next) => {
  try {
    const brands = await Product.findAll({
      attributes: [
        [
          Product.sequelize.fn("DISTINCT", Product.sequelize.col("brandName")),
          "brandName",
        ],
      ],
      raw: true, // Ensures a clean array of objects without metadata
    });

    res.status(200).json({
      success: true,
      data: brands.map((b) => b.brandName).filter(Boolean), // Extract values & filter out nulls
    });
  } catch (error) {
    logger.error("Error while feching brand names", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch unique brand names",
      error: error.message,
    });
  }
};

exports.getSuggestion = async (req, res, next) => {
  const { searchTerm, companyId } = req.query;
  try {
    const productCategories = await ProductCategory.findAll({
      where: {
        companyId: companyId,
        name: {
          [Op.like]: `%${searchTerm}%`,
        },
      },
    });

    const productSubCategories = await ProductSubCategory.findAll({
      where: {
        name: {
          [Op.like]: `%${searchTerm}%`,
        },
      },
      include: [
        {
          model: ProductCategory,
          as: "productCategory",
        },
      ],
    });

    const data = [];
    for (const category of productCategories) {
      data.push({
        id: category.id,
        name: category.name,
        type: "productCategory",
        productCategoryImage: `data:${
          category.contentType
        };base64,${category.image?.toString("base64")}`,
      });
    }
    for (const category of productSubCategories) {
      data.push({
        id: category.id,
        name: category.name,
        productCategoryId: category.productCategoryId,
        productCategoryName: category.productCategory.name,
        productCategoryImage: `data:${
          category.productCategory.contentType
        };base64,${category.productCategory?.image?.toString("base64")}`,
        type: "ProductSubCategory",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error("Error while feching suggestions", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to get result" });
  }
};

` -------------------- getPublicProducts V2 --------------------- `;
// exports.getPublicProducts = async (req, res, next) => {
//   const userId = req.user?.id;
//   const role = req.user?.role;

//   const {
//     companyId,
//     mainCategoryId,
//     subCategoryId,
//     categoryId,
//     wishlisted,
//     brands,
//     categories,
//     companyCategories,
//     companySubCategories,
//     minPrice,
//     maxPrice,
//     minDiscount,
//     searchTerm,
//   } = req.query;

//   let page = parseInt(req.query.page) || 1;
//   let limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;

//   const brandNamesArray = brands?.split(",") || [];
//   const categoryIdsArray = categories?.split(",") || [];
//   const companyCategoryIdsArray = companyCategories?.split(",") || [];
//   const companySubCategoryIdsArray = companySubCategories?.split(",") || [];

//   // Get user-specific price rule
//   let userPriceRule = null;
//   if (role === "distributor") {
//     const distributor = await distributorService.getDistributorPriceRule(
//       userId
//     );
//     userPriceRule = distributor?.priceRule || null;
//   } else if (role === "store") {
//     const store = await storeService.getStorePriceRule(userId);
//     userPriceRule = store?.priceRule || null;
//   }

//   const wishlistedProductIds = userId
//     ? await getWishlistedProductIds(userId)
//     : [];

//   const replacements = {
//     offset,
//     limit,
//     userPriceRule,
//     userId,
//     brandNames: brandNamesArray,
//     categoryIds: categoryIdsArray,
//     companyCategoryIds: companyCategoryIdsArray,
//     companySubCategoryIds: companySubCategoryIdsArray,
//     minPrice: parseFloat(minPrice) || 0,
//     maxPrice: parseFloat(maxPrice) || 999999,
//     minDiscount: parseFloat(minDiscount) || 0,
//     searchTerm: `%${searchTerm || ""}%`,
//   };

//   let filterClauses = `
//     p.isBlock = 'approved'
//     AND p.block = false
//     AND p.productStatus = true
//     AND p.originalPrice IS NOT NULL
//     AND p.deletedAt IS NULL
//   `;

//   if (wishlisted && wishlisted == "true" && userId) {
//     filterClauses += ` AND p.id IN (${wishlistedProductIds.join(",")})`;
//   }
//   if (brandNamesArray && brandNamesArray.length)
//     filterClauses += ` AND p.brandName IN (:brandNames) `;
//   if (categoryId && !isNaN(companyId))
//     filterClauses += ` AND p.productCategoryId = ${categoryId} `;
//   if (subCategoryId && !isNaN(subCategoryId))
//     filterClauses += ` AND p.productSubCategoryId = ${subCategoryId} `;
//   if (companyId && !isNaN(companyId))
//     filterClauses += ` AND p.companyId = ${companyId} `;
//   if (companyCategoryIdsArray && companyCategoryIdsArray.length)
//     filterClauses += ` AND p.productCategoryId IN (:companyCategoryIds) `;
//   if (companySubCategoryIdsArray && companySubCategoryIdsArray.length)
//     filterClauses += ` AND p.productSubCategoryId IN (:companySubCategoryIds) `;

//   if (mainCategoryId && !isNaN(mainCategoryId))
//     filterClauses += ` AND cat.mainCategoryId = ${mainCategoryId} `;
//   if (categoryIdsArray && categoryIdsArray.length)
//     filterClauses += ` AND cat.mainCategoryId IN (:categoryIds) `;

//   if (searchTerm && searchTerm !== "" && searchTerm.length > 0) {
//     filterClauses += ` AND (
//       p.productName LIKE :searchTerm
//       OR p.description LIKE :searchTerm
//       OR p.brandName LIKE :searchTerm
//     )`;
//   }

//   const baseSelect = `
//     SELECT
//       p.id,
//       p.productName,
//       p.description,
//       p.mrp,
//       p.originalPrice,
//       p.gst,
//       p.stockLevel,
//       p.discount AS majorDiscount,
//       cat.name AS category,
//       cat.mainCategoryId,
//       COALESCE(pr.priceValue, 0) AS discount,
//       ROUND((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) + ((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) * p.gst / 100), 2) AS discountedPrice
//     FROM products as p
//     LEFT JOIN price_rules as pr ON pr.productId = p.id AND pr.name = :userPriceRule
//     LEFT JOIN product_categories as cat ON cat.id = p.productCategoryId
//     WHERE ${filterClauses}
//     GROUP BY p.id, cat.name, pr.priceValue
//     HAVING discountedPrice BETWEEN :minPrice AND :maxPrice
//     AND COALESCE(pr.priceValue, 0) >= :minDiscount
//     ORDER BY p.id DESC
//     LIMIT :limit OFFSET :offset
//   `;

//   const countQuery = `
//     SELECT COUNT(*) as count
//     FROM (
//       SELECT p.id,
//       p.originalPrice,
//       p.gst,
//       cat.mainCategoryId
//       FROM products as p
//       LEFT JOIN price_rules as pr ON pr.productId = p.id AND pr.name = :userPriceRule
//       LEFT JOIN product_categories as cat ON cat.id = p.productCategoryId
//       WHERE ${filterClauses}
//       GROUP BY p.id, pr.priceValue
//       HAVING ROUND((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) + ((p.originalPrice - (p.originalPrice * COALESCE(pr.priceValue, 0) / 100)) * p.gst / 100), 2) BETWEEN :minPrice AND :maxPrice
//       AND COALESCE(pr.priceValue, 0) >= :minDiscount
//     ) AS countResult
//   `;

//   try {
//     const [products] = await sequelize.query(baseSelect, { replacements });
//     const [[{ count }]] = await sequelize.query(countQuery, { replacements });

//     const enrichedProducts = await Promise.all(
//       products.map(async (product) => {
//         const { reviewCount, averageRating } = await getReviewStats(product.id);

//         const wishlisted = userId
//           ? wishlistedProductIds.includes(product.id)
//           : false;
//         const cartItem = userId ? await getCartItem(userId, product.id) : null;
//         const image = await getOneProductImage(product.id);

//         return {
//           ...product,
//           originalPrice: product.originalPrice * (1 + product.gst / 100),
//           averageRating,
//           reviewCount,
//           wishlisted: !!wishlisted,
//           isCarted: !!cartItem,
//           quantity: cartItem?.quantity || 0,
//           image,
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         data: enrichedProducts,
//         pagination: {
//           totalItems: count,
//           currentPage: page,
//           itemsPerPage: limit,
//           totalPages: Math.ceil(count / limit),
//         },
//       },
//     });
//   } catch (error) {
//     logger.error("Error while feching products", {
//       error: error.message,
//       stack: error.stack,
//     });
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch products" });
//   }
// };

` -------------------- getPublicProducts V1 --------------------- `;
exports.getPublicProducts = async (req, res, next) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  const {
    companyId,
    mainCategoryId,
    subCategoryId,
    categoryId,
    wishlisted,
    brands,
    categories,
    companyCategories,
    companySubCategories,
    minPrice,
    maxPrice,
    minDiscount,
    searchTerm,
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;
  const brandNamesArray = brands?.split(",");
  const categoryIdsArray = categories?.split(",");
  const companyCategoryIdsArray = companyCategories?.split(",");
  const companySubCategoryIdsArray = companySubCategories?.split(",");

  const whereClause = {
    isBlock: "approved",
    block: false,
    productStatus: true,
    originalPrice: {
      [Op.not]: null,
    },
  };
  // ** get top deals **
  if (req.url.includes("/public/products/top-deals")) {
    whereClause.isTopDeal = true;
  }

  // ** product filters **
  if (companyId && !isNaN(companyId)) {
    whereClause.companyId = companyId;
  }
  if (subCategoryId && !isNaN(subCategoryId)) {
    whereClause.productSubCategoryId = subCategoryId;
  }
  if (categoryId && !isNaN(categoryId)) {
    whereClause.productCategoryId = categoryId;
  }
  if (brandNamesArray && brandNamesArray.length > 0) {
    whereClause.brandName = { [Op.in]: brandNamesArray };
  }

  if (companyCategoryIdsArray && companyCategoryIdsArray.length > 0) {
    whereClause.productCategoryId = {
      [Op.in]: [
        ...(whereClause.productCategoryId
          ? [whereClause.productCategoryId]
          : []),
        ...companyCategoryIdsArray,
      ],
    };
  }

  if (companySubCategoryIdsArray && companySubCategoryIdsArray.length > 0) {
    whereClause.productSubCategoryId = {
      [Op.in]: [
        ...(whereClause.productSubCategoryId
          ? [whereClause.productSubCategoryId]
          : []),
        ...companySubCategoryIdsArray,
      ],
    };
  }

  if (minPrice && !isNaN(minPrice)) {
    whereClause.originalPrice = {
      [Op.gte]: minPrice,
    };
  }
  if (maxPrice && !isNaN(maxPrice)) {
    whereClause.originalPrice = {
      ...whereClause.originalPrice,
      [Op.lte]: maxPrice,
    };
  }

  // ** main category filter **
  const categoryWhereClause = {};

  if (searchTerm && searchTerm.length > 0) {
    whereClause[Op.or] = [
      { productName: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
      { brandName: { [Op.like]: `%${searchTerm}%` } },
      sequelize.literal(
        `JSON_SEARCH(keywords, 'one', '%${searchTerm}%') IS NOT NULL`
      ),
    ];
  }

  if (mainCategoryId && !isNaN(mainCategoryId)) {
    categoryWhereClause.mainCategoryId = mainCategoryId;
  }

  if (categoryIdsArray && categoryIdsArray.length > 0) {
    categoryWhereClause.mainCategoryId = {
      [Op.in]: [
        ...(categoryWhereClause.mainCategoryId
          ? [categoryWhereClause.mainCategoryId]
          : []),
        ...categoryIdsArray,
      ],
    };
  }

  const includes = [
    {
      model: ProductImage,
      as: "images",
      attributes: ["id", "image", "contentType", "createdAt"],
      required: false,
    },
    {
      model: ProductCategory,
      as: "category",
      attributes: ["id", "name", "description", "mainCategoryId"],
      // required: false,
      // where: categoryWhereClause,
      // required: Object.keys(categoryWhereClause).length > 0,
    },
    {
      model: ProductSubCategory,
      as: "subCategory",
      attributes: ["id", "name"],
      // required: false,
    },
    {
      model: Company,
      as: "company",
      attributes: ["id", "companyName"],
      // whereClause: searchTerm
      //   ? {
      //       name: { [Op.like]: `%${searchTerm}%` },
      //     }
      //   : {},
      // required: false,
    },
  ];

  if (role === "distributor") {
    const distributor = await distributorService.getDistributorPriceRule(
      userId
    );

    const distributorWhere = { name: distributor.priceRule };
    if (minDiscount && !isNaN(minDiscount)) {
      distributorWhere.priceValue = { [Op.gte]: minDiscount };
    }

    includes.push({
      model: Pricerule,
      as: "pricerules",
      attributes: ["priceValue"],
      where: distributorWhere,
      required: false,
    });
  } else if (role === "store") {
    const store = await storeService.getStorePriceRule(userId);

    const storeWhere = { name: store.priceRule };
    if (minDiscount && !isNaN(minDiscount)) {
      storeWhere.priceValue = { [Op.gte]: minDiscount };
    }
    includes.push({
      model: Pricerule,
      as: "pricerules",
      attributes: ["priceValue"],
      where: storeWhere,
      required: false,
    });
  }

  if (userId) {
    if (wishlisted === "true") {
      includes.push({
        model: Wishlist,
        as: "wishlist",
        where: { userId },
        required: true,
      });
    } else {
      includes.push({
        model: Wishlist,
        as: "wishlist",
        where: { userId },
        required: false,
      });
    }

    includes.push({
      model: Cart,
      as: "cart",
      attributes: ["quantity"],
      where: { userId },
      required: false,
    });
  }

  try {
    const totalProducts = 10;
    // const totalProducts = await Product.count({
    //   where: whereClause,
    //   include: [
    //     {
    //       model: ProductCategory,
    //       as: "category",
    //       attributes: ["id", "name", "description", "mainCategoryId"],
    //       required: false,
    //       where: categoryWhereClause,
    //       required: Object.keys(categoryWhereClause).length > 0,
    //     },
    //   ],
    // });

    const products = await Product.findAll({
      where: whereClause,
      attributes: [
        "id",
        "productName",
        "stockLevel",
        "description",
        "originalPrice",
        "gst",
        "mrp",
        "discount",
      ],
      include: includes,
      offset,
      limit: parseInt(limit, 10),
    });

    const data = await Promise.all(
      products.map(async (product) => {
        const priceWithGST = calculatePriceWithGST(
          product.originalPrice,
          product.gst
        );
        const hasDiscount = product.pricerules && product.pricerules.length > 0;
        const discountValue = hasDiscount
          ? parseFloat(product.pricerules[0].priceValue)
          : 0;
        const discountedPrice = calculateDiscountedPrice(
          product.originalPrice,
          product.gst,
          discountValue
        );

        const { reviewCount, averageRating } = await getReviewStats(product.id);

        return {
          id: product.id,
          productName: product.productName,
          stockLevel: product.stockLevel,
          description: product.description,
          originalPrice: priceWithGST,
          category: product.category ? product.category.name : null,
          hasDiscount,
          specialDiscount: discountValue,

          specialDiscountAmount: getDiscountAmount(
            product.originalPrice,
            discountValue
          ),
          discountedPrice,
          mrp: product.mrp,
          majorDiscount: parseFloat(product.discount),
          majorDiscountAmount: getDiscountAmount(product.mrp, product.discount),
          wishlisted: product.wishlist?.length > 0,
          isCarted: product.cart?.length > 0,
          quantity: product.cart?.[0]?.quantity || 0,
          image:
            product.images && product.images.length > 0
              ? `data:${
                  product.images[0].contentType
                };base64,${product.images[0].image.toString("base64")}`
              : null,
          averageRating,
          reviewCount,
        };
      })
    );

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalItems: totalProducts,
          totalPages,
          currentPage: parseInt(page, 10),
          itemsPerPage: parseInt(limit, 10),
        },
      },
    });
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
};

// -- extra or may be helpful code from getPublicProducts
// Map the products into the desired format
// const data = products.map((product) => {
//   const priceWithGST = calculatePriceWithGST(
//     product.originalPrice,
//     product.gst
//   );
//   const hasDiscount = product.pricerules && product.pricerules.length > 0;
//   const discountValue = hasDiscount
//     ? parseFloat(product.pricerules[0].priceValue)
//     : 0;
//   const discountedPrice = calculateDiscountedPrice(
//     product.originalPrice,
//     product.gst,
//     discountValue
//   );

//   return {
//     id: product.id,
//     productName: product.productName,
//     stockLevel: product.stockLevel,
//     description: product.description,
//     originalPrice: priceWithGST,
//     category: product.category ? product.category.name : null,
//     hasDiscount,
//     discount: discountValue,
//     majorDiscount: parseFloat(product.discount),
//     discountedPrice,
//     wishlisted: product.wishlist?.length > 0,
//     isCarted: product.cart?.length > 0,
//     quantity: product.cart?.[0]?.quantity || 0,
//     image:
//       product.images && product.images.length > 0
//         ? `data:${
//             product.images[0].contentType
//           };base64,${product.images[0].image.toString("base64")}`
//         : null,
//   };
// });
