const { Op, literal } = require("sequelize");
const {
  Product,
  StockHistory,
  StockHistoryDocument,
  ProductCategory,
  Supplier,
  StoreProductStock,
  Batch,
  ProductUnit,
  sequelize,
} = require("../models");

const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const os = require("os");

const generateQrs = async ({
  batchNumber,
  productId,
  companyId,
  mfgDate,
  warranty,
  restockQuantity,
  productName,
  transaction,
}) => {
  const isBatchExists = await Batch.findOne({
    where: { batchNumber, productId, companyId },
  });

  if (isBatchExists) {
    throw new Error("Batch with provided number already exists.");
  }

  // 1. Create Batch
  const batch = await Batch.create(
    {
      batchNumber,
      productId,
      companyId,
      manufacturingDate: mfgDate,
      warranty,
      quantity: restockQuantity,
    },
    { transaction }
  );

  // 2. Prepare ZIP archive (streaming)
  const zipFileName = `qr_codes_batch_${batch.batchNumber}_${Date.now()}.zip`;
  const zipFilePath = path.join(os.tmpdir(), zipFileName);

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);

  // 3. Stream QR generation and DB insert
  const productUnits = [];

  for (let i = 1; i <= restockQuantity; i++) {
    const unitCode = `${productName.replace(/\s+/g, "").toUpperCase()}-${
      batch.batchNumber
    }-${String(i).padStart(restockQuantity.toString().length, "0")}`;
    const qrPayload = {
      unitCode,
      productId,
      batchNumber,
      mfgDate,
      warranty,
    };

    const qrData = JSON.stringify(qrPayload);

    // Generate QR image buffer
    const qrBuffer = await QRCode.toBuffer(qrData);

    // Append directly to archive (no temp file needed)
    archive.append(qrBuffer, { name: `${unitCode}.png` });

    productUnits.push({
      unitCode,
      batchId: batch.id,
      qrCodeData: qrPayload,
    });

    // Optional: Insert in chunks to reduce memory
    if (productUnits.length % 100 === 0 || i === restockQuantity) {
      await ProductUnit.bulkCreate(productUnits.splice(0), { transaction });
    }
  }

  await archive.finalize();

  // Wait for ZIP to finish
  await new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
  });

  return {
    zipFileName,
    zipFilePath,
    batchId: batch.id,
  };
};

exports.addStockHistory = async (storeId, companyId, role, stockData) => {
  const {
    orderType,
    productId,
    supplierId,
    restockDate,
    restockQuantity,
    price,
    files,
    stockThresholdLevel,
    gst,
    handlingCharges,
    transportCharges,
    batchNumber,
    mfgDate,
  } = stockData;
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findOne({
      where: {
        id: productId,
        companyId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Create stock history document
    const stockHistory = await StockHistory.create(
      {
        storeId: role === "store" ? storeId : null,
        companyId,
        orderType,
        productId,
        supplierId,
        restockDate,
        restockQuantity,
        price,
        gst,
        handlingCharges,
        transportCharges,
      },
      {
        transaction,
      }
    );

    // Update stock in product table
    await product.update(
      {
        stockLevel:
          parseInt(product.stockLevel, 10) + parseInt(restockQuantity, 10),
        stockUpdatedAt: new Date(),
      },
      {
        transaction,
      }
    );

    const storeProductStock = await StoreProductStock.findOne({
      where: {
        storeId: role === "store" ? storeId : null,
        productId: productId,
        companyId,
      },
    });

    if (!storeProductStock) {
      await StoreProductStock.create(
        {
          storeId: role === "store" ? storeId : null,
          productId: productId,
          companyId: companyId,
          stockLevel: restockQuantity,
          stockThresholdLevel,
        },
        {
          transaction,
        }
      );
    } else {
      await storeProductStock.update(
        {
          stockLevel:
            parseInt(storeProductStock.stockLevel, 10) +
            parseInt(restockQuantity, 10),
          stockThresholdLevel,
        },
        {
          transaction,
        }
      );
    }

    // Create stock history document for each file
    if (files && files.length > 0) {
      await StockHistoryDocument.bulkCreate(
        files.map((file) => ({
          stockHistoryId: stockHistory.id,
          fileName: file.originalname,
          contentType: file.mimetype,
          file: file.buffer,
        })),
        { transaction }
      );
    }

    // Here is qr code generation
    let zipFileName, zipFilePath;
    if (role === "companyUser") {
      const result = await generateQrs({
        batchNumber,
        productId,
        companyId,
        mfgDate,
        warranty: product.warranty,
        restockQuantity,
        productName: product.productName,
        transaction,
      });
      if (!result) {
        if (transaction) await transaction.rollback();
        throw new Error("Something went wrong");
      }
      zipFileName = result.zipFileName;
      zipFilePath = result.zipFilePath;
    }

    await transaction.commit();

    return {
      stockHistory,
      zipFileName,
      zipFilePath,
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.getStockHistoryProduct = async (
  storeId,
  companyId,
  role,
  searchTerm,
  page = 1,
  limit = 10,
  stockStatus
) => {
  try {
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const whereClause = {
      storeId: role === "store" ? storeId : null,
      companyId,
    };

    // Add stockStatus filtering using raw SQL condition
    if (stockStatus === "outOfStock") {
      whereClause.stockLevel = 0;
    } else if (stockStatus === "lowStock") {
      whereClause[Op.and] = literal(
        "`StoreProductStock`.`stockLevel` > 0 AND `StoreProductStock`.`stockLevel` <= `StoreProductStock`.`stockThresholdLevel`"
      );
    } else if (stockStatus === "inStock") {
      whereClause[Op.and] = literal(
        "`StoreProductStock`.`stockLevel` > `StoreProductStock`.`stockThresholdLevel`"
      );
    }

    const productWhere =
      searchTerm && searchTerm.length > 0
        ? { productName: { [Op.like]: `%${searchTerm}%` } }
        : {};

    const count = await StoreProductStock.count({
      where: whereClause,
      include: [
        {
          model: Product,
          as: "product",
          where: productWhere,
        },
      ],
    });

    const products = await StoreProductStock.findAll({
      where: whereClause,
      attributes: [
        "productId",
        "stockLevel",
        "stockThresholdLevel",
        "updatedAt",
      ],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
          where: productWhere,
          include: [
            {
              model: StockHistory,
              as: "stockHistory",
              attributes: ["restockDate", "restockQuantity"],
              where: {
                storeId: role === "store" ? storeId : null,
                companyId,
              },
              order: [["restockDate", "DESC"]],
            },
          ],
        },
      ],

      order: [["updatedAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return {
      data: products.map((item) => ({
        productId: item.productId,
        productName: item.product.productName,
        stockLevel: item.stockLevel,
        stockThresholdLevel: item.stockThresholdLevel,
        restockDate: new Date(
          item.product.stockHistory[0].restockDate
        ).toLocaleDateString(),
        restockQuantity: item.product.stockHistory[0].restockQuantity,
        status:
          item.stockLevel === 0
            ? "Out of Stock"
            : item.stockLevel <= item.stockThresholdLevel
            ? "Low Stock"
            : "In Stock",
      })),
      pagination: {
        count: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getStockHistoryByProductId = async (
  storeId,
  companyId,
  role,
  productId,
  page = 1,
  limit = 10,
  searchTerm
) => {
  try {
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const totalStockAdded = await StockHistory.sum("restockQuantity", {
      where: {
        productId,
        storeId: role === "store" ? storeId : null,
        companyId,
      },
    });

    const whereClause = {
      productId,
      storeId: role === "store" ? storeId : null,
      companyId,
    };

    // if (searchTerm && searchTerm.trim() !== "") {
    //   whereClause["$supplier.name$"] = { [Op.like]: `%${searchTerm}%` };
    // }

    const totalCount = await StockHistory.count({
      where: whereClause,
    });

    const product = await Product.findOne({
      where: { id: productId },
      attributes: ["id", "productName", "stockLevel", "stockThresholdLevel"],
      include: [
        {
          model: ProductCategory,
          as: "category",
          attributes: ["name"],
        },
      ],
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // **Step 3: Fetch paginated stock history separately**
    const stockHistory = await StockHistory.findAll({
      where: whereClause,
      attributes: [
        "restockDate",
        "restockQuantity",
        "price",
        "createdAt",
        "id",
        "gst",
        "handlingCharges",
        "transportCharges",
      ],
      include: [
        {
          model: StockHistoryDocument,
          as: "documents",
          attributes: ["id", "fileName"],
        },
        {
          model: Supplier,
          as: "supplier",
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]], // Most recent entries first
      limit: parseInt(limit),
      offset,
    });

    return {
      productId: product.id,
      productName: product.productName,
      categoryName: product.category.name,
      totalStockAdded: totalStockAdded || 0,
      stockHistory: stockHistory.map((item) => ({
        id: item.id,
        restockDate: new Date(item.restockDate).toLocaleDateString(),
        supplierName: item.supplier.name,
        restockQuantity: item.restockQuantity,
        price: item.price,
        gst: item.gst,
        handlingCharges: item.handlingCharges,
        transportCharges: item.transportCharges,
        totalCost: parseFloat(
          (parseFloat(item.price) + parseFloat((item.gst * item.price) / 100)) *
            item.restockQuantity +
            parseFloat(item.handlingCharges) +
            parseFloat(item.transportCharges)
        ).toFixed(2),
        documents: item.documents,
      })),
      pagination: {
        count: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getStockHistoryDocument = async (id) => {
  try {
    const stockHistoryDocument = await StockHistoryDocument.findByPk(id);
    if (!stockHistoryDocument) {
      throw new Error("Stock history document not found");
    }
    return `data:${
      stockHistoryDocument.contentType
    };base64,${stockHistoryDocument.file.toString("base64")}`;
  } catch (error) {
    throw error;
  }
};

exports.getListOfPreviouslyAddedStock = async (
  userId,
  productId,
  companyId,
  role
) => {
  const whereClause = {
    productId,
  };
  if (role === "store") {
    whereClause.storeId = userId;
  } else {
    whereClause.companyId = companyId;
    whereClause.storeId = null;
  }

  try {
    const stockHistory = await StockHistory.findAll({
      where: whereClause,
      attributes: [
        "id",
        "restockDate",
        "restockQuantity",
        "price",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 3,
    });

    return stockHistory.map((item) => ({
      id: item.id,
      restockDate: new Date(item.restockDate).toLocaleDateString(),
      restockQuantity: item.restockQuantity,
      price: item.price,
    }));
  } catch (error) {
    throw error;
  }
};
