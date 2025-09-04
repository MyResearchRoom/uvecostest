const { Op } = require("sequelize");
const {
  OfflineCustomer,
  OfflineOrder,
  OfflineOrderItem,
  OfflineOrderTransaction,
  Product,
  ProductImage,
  StoreProductStock,
  sequelize,
} = require("../models");

exports.createOfflineOrder = async (orderData, storeId, companyId) => {
  const {
    name,
    mobileNumber,
    email,
    date,
    address,
    pinCode,
    state,
    district,
    city,
    products,
    paidAmount,
    paymentMode,
    transactionId,
  } = orderData;
  const transaction = await sequelize.transaction();

  try {
    let customer = await OfflineCustomer.findOne({
      where: { mobileNumber, storeId, companyId },
    });
    
    if (!customer) {
      customer = await OfflineCustomer.create(
        {
          name,
          mobileNumber,
          email,
          date,
          address,
          pinCode,
          state,
          district,
          city,
          storeId,
          companyId,
        },
        { transaction }
      );
    }

    let total = 0;
    for (const product of products) {
      const productData = await Product.findOne({
        where: { id: product.productId, companyId },
        attributes: ["originalPrice", "gst", "id", "mrp", "productName"],
        include: [
          {
            model: StoreProductStock,
            as: "stock",
            where: {
              storeId,
              companyId,
            },
            required: false,
          },
        ],
      });

      if (!productData) throw new Error(`Product not found!`);

      if (!productData.stock) {
        throw new Error(
          `Please add stock for product ${productData.productName}`
        );
      }

      if (productData.stock.stockLevel < product.quantity) {
        throw new Error(
          `Not enough stock for product ${productData.productName}`
        );
      }

      const basePrice = productData.originalPrice;
      const gstAmount = (basePrice * productData.gst) / 100;
      const finalPrice = parseFloat(basePrice) + parseFloat(gstAmount);
      const subTotal = finalPrice * product.quantity;
      total = parseFloat(total) + parseFloat(subTotal);
    }

    const order = await OfflineOrder.create(
      {
        customerId: customer.id,
        storeId,
        companyId,
        total,
        remainingAmount: total - paidAmount,
        createdAt: date ? date : new Date(),
      },
      { transaction }
    );

    for (const product of products) {
      const productData = await Product.findByPk(product.productId, {
        attributes: ["originalPrice", "gst", "id", "mrp", "warranty"],
      });
      const basePrice = productData.originalPrice;
      const gstAmount = (basePrice * productData.gst) / 100;
      const finalPrice = parseFloat(basePrice) + parseFloat(gstAmount);

      let warrantyExpiresAt = new Date();
      warrantyExpiresAt.setDate(
        warrantyExpiresAt.getDate() + (productData.warranty || 0) * 365
      );

      await OfflineOrderItem.create(
        {
          orderId: order.id,
          productId: product.productId,
          quantity: product.quantity,
          mrp: product.mrp ?? 0,
          price: finalPrice,
          gst: productData.gst,
          subTotal: finalPrice * product.quantity,
          warrantyCodes: product.warrantyCodes,
          warrantyExpiresAt,
        },
        { transaction }
      );

      await StoreProductStock.decrement(
        { stockLevel: product.quantity },
        {
          where: {
            productId: product.productId,
            storeId,
            companyId,
          },
          transaction,
        }
      );
    }

    await OfflineOrderTransaction.create(
      {
        orderId: order.id,
        transactionId,
        paidAmount,
        paymentMode,
      },
      { transaction }
    );

    await transaction.commit();
    return { success: true, orderId: order.id };
  } catch (error) {
    await transaction.rollback();
    return { success: false, message: error.message };
  }
};

exports.getOrders = async (req) => {
  const {
    orderDate,
    paymentStatus,
    page = 1,
    limit = 10,
    searchTerm = "",
  } = req.query;
  const offset = (page - 1) * limit;

  const storeId = req.user.role === "store" ? req.user.id : null;
  const companyId = req.user.companyId;

  let whereClause = { storeId: storeId, companyId };

  if (
    orderDate &&
    orderDate !== "" &&
    orderDate !== null &&
    orderDate !== undefined
  ) {
    whereClause.createdAt = { [Op.eq]: new Date(orderDate) };
  }

  if (paymentStatus) {
    whereClause.remainingAmount = paymentStatus === "Paid" ? 0 : { [Op.gt]: 0 };
  }

  if (searchTerm && searchTerm.trim().length > 0) {
    whereClause["$customer.name$"] = { [Op.like]: `%${searchTerm}%` };
  }

  const { rows: orders, count } = await OfflineOrder.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: OfflineCustomer,
        as: "customer",
        attributes: ["name", "mobileNumber"],
      },
      {
        model: OfflineOrderTransaction,
        as: "transactions",
        attributes: ["paymentMode"],
        order: [["createdAt", "DESC"]],
        limit: 1,
      },
    ],
    attributes: ["id", "createdAt", "total", "remainingAmount"],
    order: [["createdAt", "DESC"]],
    offset: parseInt(offset, 10),
    limit: parseInt(limit, 10),
  });

  const data = orders.map((order) => ({
    id: order.id,
    customerName: order.customer ? order.customer.name : "Unknown",
    mobileNumber: order.customer ? order.customer.mobileNumber : "NA",
    orderDate: order.createdAt,
    total: order.total,
    remainingAmount: order.remainingAmount,
    paymentStatus:
      parseFloat(order.remainingAmount) === 0.0 ? "Paid" : "Partially Paid",
    paymentMode:
      order.transactions.length > 0 ? order.transactions[0].paymentMode : "N/A",
  }));

  const pagination = {
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
  };

  return {
    data,
    pagination,
  };
};

exports.getOrderDetails = async (orderId, user) => {
  try {
    const storeId = user.role === "store" ? user.id : null;
    const order = await OfflineOrder.findOne({
      where: { id: orderId, storeId: storeId, companyId: user.companyId },
      include: [
        {
          model: OfflineCustomer,
          as: "customer",
          attributes: [
            "name",
            "mobileNumber",
            "email",
            "address",
            "pinCode",
            "state",
            "district",
            "city",
          ],
        },
        {
          model: OfflineOrderItem,
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "productName", "originalPrice", "gst"],
              as: "product",
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "image", "contentType", "createdAt"],
                },
              ],
            },
          ],
          attributes: ["quantity", "price", "gst", "subTotal"],
        },
      ],
    });

    if (!order) return null;

    return {
      id: order.id,
      customer: order.customer,
      orderDate: order.createdAt,
      total: order.total,
      remainingAmount: order.remainingAmount,
      paidAmount: order.total - order.remainingAmount,
      paymentStatus: order.remainingAmount === 0 ? "Paid" : "Partially Paid",
      // transactions: order.transactions,
      items: order.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.productName,
        image:
          item.product.images && item.product.images.length > 0
            ? `data:${
                item.product.images[0].contentType
              };base64,${item.product.images[0].image.toString("base64")}`
            : null,
        quantity: item.quantity,
        price: item.price,
        gst: item.gst,
        subTotal: item.subTotal,
      })),
    };
  } catch (error) {
    console.error(error);
  }
};

exports.repayAmount = async (
  orderId,
  rePayingAmount,
  paymentMode,
  transactionId
) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await OfflineOrder.findByPk(orderId);
    if (!order) throw new Error("Order not found");

    const newRemainingAmount = order.remainingAmount - rePayingAmount;
    if (newRemainingAmount < 0) throw new Error("Overpayment not allowed");

    await order.update(
      { remainingAmount: newRemainingAmount },
      { transaction }
    );

    await OfflineOrderTransaction.create(
      { orderId, transactionId, paidAmount: rePayingAmount, paymentMode },
      { transaction }
    );

    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    return { success: false, message: error.message };
  }
};
