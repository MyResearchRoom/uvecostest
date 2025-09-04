const { Op, fn, col, literal, where } = require("sequelize");
const {
  WarrantyClaim,
  WarrantyImage,
  User,
  CustomerAddress,
  Product,
  ProductImage,
  Order,
  OrderItem,
  OrderProduct,
  sequelize,
} = require("../models");
const {
  generateRandomSerialNo,
  generateRandomClaimId,
} = require("../utils/idGenerator");
const { validateQueryParams } = require("../utils/validateQueryParams");

exports.raiseWarrantyClaim = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { orderId, productId, issue, warrantyCode } = req.body;

    if (!orderId || !productId || !issue) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const op = await OrderProduct.findOne({
      where: {
        orderItemId: orderId,
        productId: productId,
      },
    });

    if (!op) {
      return res.status(400).json({ success: false, message: "Invalid Order" });
    }

    if (!op.warrantyCode.includes(warrantyCode)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid warranty code",
      });
    }

    if (op.warrantyDays === 0 || op.warrantyExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Warranty has expired" });
    }

    const invoiceFiles = req.files.invoice;
    const warrantySlipFiles = req.files.warrantySlip;
    const media = req.files["media[]"] || [];

    if (!invoiceFiles) {
      return res.status(400).json({
        success: false,
        message: "Invoice and warranty slip are required.",
      });
    }

    if (invoiceFiles.length > 1 || warrantySlipFiles?.length > 1) {
      return res.status(400).json({
        success: false,
        message: "Only one file is allowed for both Invoice and Warranty Slip.",
      });
    }

    const invoice = invoiceFiles[0];
    const warrantySlip =
      warrantySlipFiles?.length > 0 ? warrantySlipFiles[0] : null;

    const newClaim = await WarrantyClaim.create({
      customerId,
      orderId,
      productId,
      issue,
      serialNo: generateRandomSerialNo(),
      claimId: generateRandomClaimId(),
      date: new Date(),
      invoice: invoice.buffer,
      invoiceType: invoice.mimetype,
      warrantyCode,
      warrantySlip: warrantySlip?.buffer || null,
      warrantySlipType: warrantySlip?.mimetype || null,
    });

    const mediaEntries = media.map((file) => ({
      warrantyClaimId: newClaim.id,
      image: file.buffer,
      contentType: file.mimetype,
    }));

    if (mediaEntries.length > 0) {
      await WarrantyImage.bulkCreate(mediaEntries);
    }

    res.status(201).json({
      success: true,
      message: "Warranty claim submitted successfully.",
      data: newClaim,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to submit claim.",
    });
  }
};

exports.getProductsClaimList = async (req, res) => {
  try {
    const { searchTerm, limit, page, offset } = validateQueryParams({
      ...req.query,
    });

    const whereClause = { companyId: req.user.companyId };
    if (searchTerm) {
      whereClause["$product.productName$"] = {
        [Op.like]: `%${searchTerm}%`,
      };
    }

    const listData = await WarrantyClaim.findAll({
      attributes: ["productId", [fn("COUNT", col("productId")), "claimCount"]],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName"],
          where: whereClause,
        },
      ],
      group: ["productId", "product.id"],
      offset,
      limit,
      subQuery: false,
    });

    const totalCount = await WarrantyClaim.count({
      include: [
        {
          model: Product,
          as: "product",
          where: whereClause,
        },
      ],
      distinct: true,
      col: "productId",
    });

    const claimListData = listData.map((item) => ({
      id: item.product.id,
      productName: item.product.productName,
      claimCount: parseInt(item.get("claimCount")),
    }));

    res.status(200).json({
      success: true,
      message: "Products claim list fetched successfully.",
      data: {
        data: claimListData,
        pagination: {
          totalRecords: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Products claim list.",
    });
  }
};

exports.getWarrantyClaimsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, date } = req.query;
    const { searchTerm, limit, page, offset } = validateQueryParams({
      ...req.query,
    });

    const claimWhereClause = { productId };
    if (status) claimWhereClause.status = status;
    if (date) claimWhereClause.date = date;

    const customerWhereClause = {};
    if (searchTerm) {
      customerWhereClause.name = { [Op.like]: `%${searchTerm}%` };
    }

    const product = await Product.findByPk(productId, {
      attributes: ["id", "productName"],
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["image"],
          limit: 1,
        },
      ],
      where: {
        companyId: req.user.companyId,
      },
    });

    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found." });
    }

    const productInfo = product
      ? {
          id: product.id,
          productName: product.productName,
          productImage: product.images?.[0]?.image
            ? `data:image/jpeg;base64,${product.images[0].image.toString(
                "base64"
              )}`
            : null,
        }
      : null;

    const claimsData = await WarrantyClaim.findAll({
      where: claimWhereClause,
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["name"],
          where: customerWhereClause,
        },
      ],
      attributes: [
        "id",
        "claimId",
        "serialNo",
        "issue",
        "status",
        "date",
        "resolutionSummary",
      ],
      offset,
      limit,
      subQuery: false,
    });

    const totalCount = await WarrantyClaim.count({
      where: claimWhereClause,
      include: [
        {
          model: User,
          as: "customer",
          where: customerWhereClause,
        },
      ],
      distinct: true,
    });

    const data = claimsData.map((claim) => ({
      id: claim.id,
      claimId: claim.claimId,
      serialNo: claim.serialNo,
      issue: claim.issue,
      status: claim.status,
      date: claim.date,
      resolutionSummary: claim.resolutionSummary,
      customerName: claim.customer?.name || null,
    }));

    res.status(200).json({
      success: true,
      message: claimsData.length
        ? "Warranty claims fetched successfully."
        : "No claims found matching the filters.",
      product: productInfo,
      data: {
        data,
        pagination: {
          totalRecords: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch warranty claims.",
    });
  }
};

exports.getWarrantyClaimsById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await WarrantyClaim.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "customer",
          attributes: ["name", "email", "mobileNumber", "id"],
          include: [
            {
              model: CustomerAddress,
              as: "customerAddress",
              attributes: [
                "baseAddress",
                "street",
                "city",
                "state",
                "district",
                "country",
              ],
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName", "warranty", "id"],
        },
        {
          model: OrderItem,
          as: "order",
          attributes: ["orderId"],
        },
        {
          model: WarrantyImage,
          as: "images",
          attributes: ["id", "image", "contentType", "createdAt"],
        },
      ],
    });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Warranty claim details not found.",
      });
    }

    const claimData = {
      id: claim.id,
      claimId: claim.claimId,
      serialNo: claim.serialNo,
      date: claim.date,
      issue: claim.issue,
      status: claim.status,
      resolutionSummary: claim.resolutionSummary,
      rejectReason: claim.rejectReason,
      customer: claim.customer,
      address: claim.address,
      product: claim.product,
      order: claim.order,
      invoice: {
        contentType: claim.invoiceType,
        dataUrl: `data:${claim.invoiceType};base64,${claim.invoice.toString(
          "base64"
        )}`,
      },
      warrantySlip: {
        contentType: claim.warrantySlipType,
        dataUrl: `data:${
          claim.warrantySlipType
        };base64,${claim.warrantySlip?.toString("base64")}`,
      },
      images: claim.images.map((img) => ({
        id: img.id,
        createdAt: img.createdAt,
        contentType: img.contentType,
        dataUrl: `data:${img.contentType};base64,${img.image.toString(
          "base64"
        )}`,
      })),
    };

    res.status(200).json({
      success: true,
      message: "Warranty claim details fetched successfully.",
      data: claimData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get warranty claim details.",
    });
  }
};

exports.getCustomerWarrantyClaimHistory = async (req, res) => {
  try {
    let { customerId, productId, orderItemId } = req.params;

    if(!customerId && req.user.role === 'customer'){
      customerId = req.user.id;
    }

    if (!customerId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Product and customer are required.",
      });
    }
    const whereClause={customerId,productId} 
    if(orderItemId) whereClause.orderId=orderItemId

    const claimsData = await WarrantyClaim.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
        },
        {
          model: User,
          as: "customer",
          attributes: ["name"],
        },
      ],
      attributes: [
        "id",
        "claimId",
        "issue",
        "status",
        "date",
        "resolutionSummary",
      ],
    });

    if (!claimsData.length) {
      return res.status(404).json({
        success: false,
        message: "No claim history found for this product.",
      });
    }

    const customer = claimsData[0].customer;
    const product = claimsData[0].product;

    const data = claimsData.map((claim) => ({
      id: claim.id,
      claimId: claim.claimId,
      issue: claim.issue,
      status: claim.status,
      date: claim.date,
      resolutionSummary: claim.resolutionSummary,
    }));

    res.status(200).json({
      success: true,
      message: "Claim history fetched successfully.",
      customer: {
        customerName: customer.name,
      },
      product: {
        productName: product.productName,
      },
      totalClaims: data.length,

      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch claim history.",
    });
  }
};

exports.rejectWarrantyClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;

    if (!claimId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Claim ID and rejection reason are required.",
      });
    }

    const claim = await WarrantyClaim.findOne({ where: { claimId } });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Warranty Claim not found.",
      });
    }

    if (claim.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Claim has already been rejected.",
      });
    }

    claim.status = "rejected";
    claim.rejectReason = reason;
    await claim.save();

    res.status(200).json({
      success: true,
      message: "Warranty Claim rejected successfully.",
      data: {
        claimId: claim.claimId,
        status: claim.status,
        rejectReason: claim.rejectReason,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.approveWarrantyClaim = async (req, res) => {
  try {
    const { claimId } = req.params;

    if (!claimId) {
      return res.status(400).json({
        success: false,
        message: "Claim Id is required",
      });
    }

    const claim = await WarrantyClaim.findOne({ where: { claimId } });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Warranty claim not found",
      });
    }

    claim.status = "approved";
    await claim.save();

    res.status(200).json({
      success: true,
      message: "Warranty Claim approved successfully.",
      data: {
        claimId: claim.claimId,
        status: claim.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve warranty claim.",
    });
  }
};

exports.resolveWarrantyClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { summary } = req.body;

    if (!claimId) {
      return res.status(400).json({
        success: false,
        message: "Claim Id is required",
      });
    }

    const claim = await WarrantyClaim.findOne({ where: { claimId } });

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Warranty claim not found",
      });
    }

    if (claim.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved claims can be resolved",
      });
    }

    claim.status = "resolved";
    (claim.resolutionSummary = summary), await claim.save();

    return res.status(200).json({
      success: true,
      message: "Warranty claim status changed to resolved successfully.",
      data: {
        claimId: claim.claimId,
        status: claim.status,
        resolutionSummary: claim.resolutionSummary,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to change status of warranty claim to resolved.",
    });
  }
};

exports.getClaimsCount = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const whereCompany = {
      include: [
        {
          model: OrderItem,
          as: "order",
          where: { companyId },
          attributes: [],
        },
      ],
    };

    const totalClaims = await WarrantyClaim.count({
      ...whereCompany,
    });

    const pendingClaims = await WarrantyClaim.count({
      where: { status: "pending" },
      ...whereCompany,
    });

    const approvedClaims = await WarrantyClaim.count({
      where: {
        status: ["approved", "resolved"],
      },
      ...whereCompany,
    });

    const rejectedClaims = await WarrantyClaim.count({
      where: { status: "rejected" },
      ...whereCompany,
    });

    res.status(200).json({
      success: true,
      message: "Claims count fetched successfully.",
      data: { totalClaims, pendingClaims, approvedClaims, rejectedClaims },
    });
  } catch (error) {
    console.error("Error in getClaimsCount:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claims count.",
    });
  }
};

exports.getCustomerClaimCount = async (req, res) => {
  try {
    const { searchTerm, page, limit, offset } = validateQueryParams({
      ...req.query,
    });

    const data = await sequelize.query(
      `
        SELECT
        u.id,
        u.name,
        u.email,
        COUNT(op.warrantyDays) AS registerWarranties,
        most_city.city
        FROM
            users AS u
            LEFT JOIN orders AS o ON u.id = o.customerId
            LEFT JOIN order_items AS oi ON o.id = oi.orderId
            LEFT JOIN order_products AS op ON op.orderItemId = oi.id
            LEFT JOIN (
                SELECT
                    ranked.userId,
                    ranked.city
                FROM (
                    SELECT
                        u.id AS userId,
                        da.city,
                        COUNT(*) AS city_count,
                        ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY COUNT(*) DESC) AS rn
                    FROM
                        users u
                        JOIN orders o ON u.id = o.customerId
                        JOIN order_items oi ON o.id = oi.orderId
                        JOIN delivery_addresses da ON da.id = oi.deliveryAddressId
                    GROUP BY u.id, da.city
                ) AS ranked
                WHERE ranked.rn = 1
            ) AS most_city ON most_city.userId = u.id
        WHERE
            op.warrantyDays > 0
            AND u.name LIKE :searchTerm
            AND oi.companyId = :companyId
        GROUP BY
            u.id, u.name, u.email, most_city.city
        HAVING
            registerWarranties > 0
        ORDER BY
            u.name ASC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          searchTerm: `%${searchTerm}%`,
          limit: parseInt(limit),
          offset: parseInt(offset),
          companyId: req.user.companyId,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const countResult = await sequelize.query(
      `
      SELECT COUNT(*) as total FROM (
        SELECT
            u.id
        FROM
            users AS u
                LEFT JOIN orders AS o ON u.id = o.customerId
                LEFT JOIN order_items AS oi ON o.id = oi.orderId
                LEFT JOIN order_products AS op ON op.orderItemId = oi.id
        WHERE
            op.warrantyDays > 0 AND u.name LIKE :searchTerm AND oi.storeId = :storeId
        GROUP BY
            u.id, u.name, u.email
        HAVING
            COUNT(op.warrantyDays) > 0
      ) AS temp
      `,
      {
        replacements: {
          searchTerm: `%${searchTerm}%`,
          storeId: req.user.id,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const total = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalRecords: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching registered warranty users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users with registered warranties",
    });
  }
};

exports.getCustomerClaims = async (req, res) => {
  try {
    const { searchTerm, limit, page, offset } = validateQueryParams({
      ...req.query,
    });

    const whereClause = {
      warrantyDays: {
        [Op.gt]: 0,
      },
      "$orderItem.order.customerId$": req.params.customerId,
      "$orderItem.companyId$": req.user.companyId,
    };
    if (searchTerm) {
      whereClause[Op.or] = [
        {
          "$product.productName$": {
            [Op.like]: `%${searchTerm}%`,
          },
        },
        {
          "$orderItem.orderId$": {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      ];
    }

    const { rows, count } = await OrderProduct.findAndCountAll({
      attributes: [
        "id",
        "warrantyCode",
        "warrantyDays",
        "warrantyExpiresAt",
        "quantity",
      ],
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id"],
          include: [
            {
              model: Order,
              as: "order",
              attributes: ["id", "createdAt"],
              required: true,
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName"],
        },
      ],
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    const data = rows.map((o) => ({
      id: o.id,
      warrantyCode: o.warrantyCode ?? "NA",
      productName: o.product.productName,
      productId: o.product.id,
      orderId: o.orderItem.order.id,
      quantity: o.quantity,
      warrantyPeriod: o.warrantyDays / 365,
      purchaseDate: new Date(o.orderItem.order.createdAt).toLocaleDateString(),
      warrantyExpiry: new Date(o.warrantyExpiresAt).toLocaleDateString(),
      status: new Date(o.warrantyExpiresAt) < new Date() ? "Expired" : "Active",
    }));
    res.status(200).json({
      success: true,
      data: {
        data,
        pagination: {
          totalRecords: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer claims",
    });
  }
};

exports.getTopMostFivePorduct = async (req, res) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user.companyId;

    if (!month || !year) {
      return res
        .status(400)
        .json({ success: false, message: "Month and year are required" });
    }

    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const topProducts = await WarrantyClaim.findAll({
      attributes: [
        "productId",
        [fn("COUNT", col("WarrantyClaim.id")), "claimCount"],
      ],
      include: [
        {
          model: OrderItem,
          as: "order",
          attributes: [],
          where: {
            companyId,
          },
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
        },
      ],
      where: {
        date: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      group: ["productId", "product.id", "product.productName"],
      order: [[literal("claimCount"), "DESC"]],
      limit: 5,
    });

    const response = topProducts.map((item) => ({
      productName: item.product.productName,
      claimCount: parseInt(item.get("claimCount")),
    }));

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("Error in getTopMostFivePorduct:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getAvgClaimOfProduct = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // 1. Ensure product belongs to the company
    const product = await Product.findOne({
      where: {
        id: productId,
        companyId,
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found." });
    }

    // 2. Count registered warranties
    const registeredWarranties = await OrderProduct.count({
      where: {
        productId,
        warrantyDays: {
          [Op.gt]: 0,
        },
      },
    });

    // 3. Count warranty claims
    const warrantyClaims = await WarrantyClaim.count({
      where: {
        productId,
      },
    });

    // 4. Compute average
    const avgClaimRate =
      registeredWarranties > 0 ? warrantyClaims / registeredWarranties : 0;

    return res.status(200).json({
      productName: product.name,
      registeredWarranties,
      warrantyClaims,
      avgClaimRate: parseFloat(avgClaimRate.toFixed(2)),
    });
  } catch (error) {
    console.error("Error in getAvgClaimOfProduct:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
