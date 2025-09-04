const { Op, fn, col } = require("sequelize");
const {
  Company,
  Order,
  OrderItem,
  OrderStatusHistory,
  Product,
  Store,
  User,
  ProductImage,
  Pricerule,
  DeliveryAddress,
  ReturnImage,
  Cart,
  OrderProduct,
  CancelOrder,
  ReturnOrder,
  CancelOrderStatusHistory,
  ReturnOrderStatusHistory,
  StoreProductStock,
  BigOrder,
  BigOrderItem,
  BigOrderStatusHistory,
  Review,
  sequelize,
} = require("../models");

const { decryptSensitiveData } = require("../utils/cryptography");
const { getCompanyOwnStore } = require("./AuthService");

const processingAllowedTransitions = {
  pending: ["accepted", "cancelled", "rejected"],
  accepted: ["readyToDispatch", "cancelled"],
  readyToDispatch: ["inTransit", "cancelled"],
  inTransit: ["completed", "cancelled"],
  completed: ["return"],
};

const cancelAllowedTransitions = {
  pending: ["accepted", "rejected"],
  accepted: ["refunded"],
};

const returnAllowedTransitions = {
  pending: ["accepted", "rejected"],
  accepted: ["pickUp"],
  pickUp: ["received"],
  received: ["refunded"],
};

const getFinalPrice = (originalPrice, gst, discount) => {
  const gstv = originalPrice * (gst / 100);
  const discountedPrice = originalPrice - originalPrice * (discount / 100);
  return parseInt(discountedPrice + gstv);
};

const calculatePriceWithGST = (price, gst) =>
  parseInt(price) + parseInt((price / 100) * gst);

const calculateDiscountedPrice = (price, gst, discount) =>
  !discount
    ? calculatePriceWithGST(price, gst)
    : getFinalPrice(price, gst, discount);

exports.placeOrder = async (orderData) => {
  const { customerId, address, products, paymentMethod } = orderData;

  const transaction = await sequelize.transaction();
  try {
    const deliveryAddress = await DeliveryAddress.create(
      {
        ...address,
      },
      {
        transaction,
      }
    );

    let total = 0;
    const productIds = [];

    for (const item of products) {
      const product = await Product.findByPk(item.productId, {
        attributes: [
          "companyId",
          "originalPrice",
          "gst",
          "id",
          "stockLevel",
          "productName",
          "discount",
          "handlingCharges",
          "shippingCharges",
          "otherCharges",
        ],
      });

      if (!product) {
        const error = new Error("Product not found");
        error.status = 404;
        throw error;
      }

      productIds.push(product.id);
      if (product.stockLevel < item.quantity) {
        const error = new Error(
          `Insufficient stock of product ${product.productName} to place order`
        );
        error.status = 400;
        throw error;
      }

      total +=
        item.quantity *
        (parseFloat(product.originalPrice) +
          (product.handlingCharges || 0) +
          (product.shippingCharges || 0) +
          (product.otherCharges || 0) +
          (product.originalPrice * product.gst) / 100);
    }

    const order = await Order.create(
      {
        customerId,
        totalAmount: total,
        isPaid: paymentMethod === "cod" ? false : true,
        paymentMethod,
      },
      {
        transaction,
      }
    );

    const createdOrders = [];
    const productGroups = {};

    for (const item of products) {
      const product = await Product.findByPk(item.productId, {
        attributes: [
          "productName",
          "companyId",
          "originalPrice",
          "mrp",
          "returnOption",
          "warranty",
          "stockLevel",
          "gst",
          "id",
          "discount",
          "handlingCharges",
          "shippingCharges",
          "otherCharges",
        ],
      });

      const companyId = product.companyId;

      const stores = await Store.findAll({
        attributes: ["id", "userId", "postalCodes"],
        where: {
          companyId,
          [Op.and]: sequelize.literal(
            `JSON_CONTAINS(postalCodes, '"${address.pinCode}"')`
          ),
          storeType: "thirdPartyStore",
        },
        include: [
          {
            model: User,
            as: "user",
            include: [
              {
                model: StoreProductStock,
                as: "stock",
                where: {
                  productId: product.id,
                  stockLevel: { [Op.gte]: item.quantity },
                },
                required: true,
              },
            ],
            required: true,
          },
        ],
      });

      let storeId = null;
      let isStoreFound = false;
      let companyOwnStock = null;

      if (stores.length > 0) {
        storeId = stores[0].userId;
        isStoreFound = true;
      } else {
        const companyOwnStore = await Store.findOne({
          where: {
            companyId,
            storeType: "companyOwnStore",
          },
          include: [
            {
              model: User,
              as: "user",
              include: [
                {
                  model: StoreProductStock,
                  as: "stock",
                  where: {
                    productId: product.id,
                    stockLevel: { [Op.gte]: item.quantity },
                  },
                  required: true,
                },
              ],
              required: true,
            },
          ],
        });

        if (companyOwnStore) {
          storeId = companyOwnStore.userId;
          isStoreFound = true;
        } else {
          companyOwnStock = await StoreProductStock.findOne({
            where: {
              productId: product.id,
              companyId,
              storeId: {
                [Op.eq]: null,
              },
              stockLevel: { [Op.gte]: item.quantity },
            },
          });

          if (!companyOwnStock) {
            throw new Error(
              `Insufficient stock of product ${product.productName} to place order`
            );
          } else {
            const companyOwnStore = await Store.findOne({
              where: {
                companyId,
                storeType: "companyOwnStore",
              },
            });

            if (!companyOwnStore) {
              throw new Error(
                `Insufficient stock of product ${product.productName} to place order`
              );
            }

            storeId = companyOwnStore.userId;
          }
        }
      }

      const key = `${storeId}_${companyId}`;

      if (!productGroups[key]) {
        productGroups[key] = {
          storeId,
          companyId,
          items: [],
        };
      }

      productGroups[key].items.push({
        productId: item.productId,
        mrp: product.mrp || 0,
        price:
          parseFloat(product.originalPrice) +
          (product.originalPrice * product.gst) / 100,
        gst: product.gst,
        discount: (product.mrp || 0) - product.originalPrice,
        handlingCharges: product.handlingCharges,
        shippingCharges: product.shippingCharges,
        otherCharges: product.otherCharges,
        returnOption: product.returnOption,
        warranty: product.warranty || 0,
        quantity: item.quantity,
        subTotal:
          item.quantity *
          (parseFloat(product.originalPrice) +
            (product.handlingCharges || 0) +
            (product.shippingCharges || 0) +
            (product.otherCharges || 0) +
            (product.originalPrice * product.gst) / 100),
      });

      product.stockLevel -= item.quantity;

      await product.save({ transaction });

      if (isStoreFound) {
        await StoreProductStock.decrement(
          {
            stockLevel: item.quantity,
          },
          {
            where: {
              storeId,
              companyId,
              productId: item.productId,
            },
            transaction,
          }
        );
      } else {
        await StoreProductStock.decrement(
          {
            stockLevel: item.quantity,
          },
          {
            where: {
              storeId: {
                [Op.eq]: null,
              },
              companyId,
              productId: item.productId,
            },
            transaction,
          }
        );
      }
    }

    for (const key in productGroups) {
      const { storeId, companyId, items } = productGroups[key];
      const orderItem = await OrderItem.create(
        {
          orderId: order.id,
          storeId,
          companyId,
          orderStatus: "pending",
          subTotal: items.reduce((sum, item) => sum + item.subTotal, 0),
          deliveryAddressId: deliveryAddress.id,
        },
        {
          transaction,
        }
      );

      createdOrders.push(orderItem);

      await OrderStatusHistory.create(
        {
          orderItemId: orderItem.id,
          status: "pending",
        },
        {
          transaction,
        }
      );

      for (const item of items) {
        await OrderProduct.create(
          {
            orderItemId: orderItem.id,
            productId: item.productId,
            quantity: item.quantity,
            returnDays: item.returnOption,
            warrantyDays: Math.round(item.warranty * 365),
            mrp: item.mrp,
            price: item.price,
            gst: item.gst,
            discount: item.discount,
            handlingCharges: item.handlingCharges || 0,
            shippingCharges: item.shippingCharges || 0,
            otherCharges: item.otherCharges || 0,
            status: "processing",
          },
          {
            transaction,
          }
        );
      }
    }

    await Cart.destroy({
      where: {
        userId: customerId,
        productId: {
          [Op.in]: productIds,
        },
      },
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    return createdOrders;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.placeBigOrder = async (orderData) => {
  const {
    customerId,
    address,
    products,
    paymentMethod,
    orderUser,
    priceRuleName,
  } = orderData;

  const transaction = await sequelize.transaction();
  try {
    const deliveryAddress = await DeliveryAddress.create(
      {
        ...address,
      },
      {
        transaction,
      }
    );

    let total = 0;
    const productIds = [];

    for (const item of products) {
      const product = await Product.findByPk(item.productId, {
        attributes: [
          "companyId",
          "originalPrice",
          "gst",
          "id",
          "stockLevel",
          "productName",
          "discount",
          "handlingCharges",
          "shippingCharges",
          "otherCharges",
        ],
        include: [
          {
            model: Pricerule,
            as: "pricerules",
            where: {
              name: priceRuleName,
            },
            required: false,
          },
        ],
      });

      if (!product) {
        const error = new Error("Product not found");
        error.status = 404;
        throw error;
      }

      productIds.push(product.id);

      if (product.stockLevel < item.quantity && orderUser === "distributor") {
        const error = new Error(
          `Insufficient stock of product ${product.productName} to place order`
        );
        error.status = 400;
        throw error;
      }

      total +=
        (calculateDiscountedPrice(
          product.originalPrice,
          product.gst,
          product.pricerules?.[0]?.priceValue
        ) +
          (product.handlingCharges || 0) +
          (product.shippingCharges || 0) +
          (product.otherCharges || 0)) *
        item.quantity;
    }

    const order = await BigOrder.create(
      {
        customerId,
        totalAmount: total,
        isPaid: paymentMethod === "cod" ? false : true,
        paymentMethod,
        orderUser: orderUser,
        deliveryAddressId: deliveryAddress ? deliveryAddress.id : null,
      },
      {
        transaction,
      }
    );

    const ordersData = [];

    for (const item of products) {
      const product = await Product.findByPk(item.productId, {
        attributes: [
          "companyId",
          "originalPrice",
          "mrp",
          "stockLevel",
          "gst",
          "id",
          "productName",
          "discount",
          "handlingCharges",
          "shippingCharges",
          "otherCharges",
        ],
        include: [
          {
            model: Pricerule,
            as: "pricerules",
            where: {
              name: priceRuleName,
            },
            required: false,
          },
        ],
      });

      const companyId = product.companyId;

      let storeId = null;
      let isStoreFound = false;
      let companyOwnStock = null;

      if (orderUser === "distributor") {
        const companyOwnStore = await Store.findOne({
          where: {
            companyId,
            storeType: "companyOwnStore",
          },
          include: [
            {
              model: User,
              as: "user",
              include: [
                {
                  model: StoreProductStock,
                  as: "stock",
                  where: {
                    productId: product.id,
                    stockLevel: { [Op.gte]: item.quantity },
                  },
                  required: true,
                },
              ],
              required: true,
            },
          ],
        });

        if (companyOwnStore) {
          storeId = companyOwnStore.userId;
          isStoreFound = true;
        } else {
          companyOwnStock = await StoreProductStock.findOne({
            where: {
              productId: product.id,
              companyId,
              storeId: {
                [Op.eq]: null,
              },
              stockLevel: { [Op.gte]: item.quantity },
            },
          });

          if (!companyOwnStock) {
            throw new Error(
              `Insufficient stock of product ${product.productName} to place order`
            );
          } else {
            const companyOwnStore = await Store.findOne({
              where: {
                companyId,
                storeType: "companyOwnStore",
              },
            });

            if (!companyOwnStore) {
              throw new Error(
                `Insufficient stock of product ${product.productName} to place order`
              );
            }

            storeId = companyOwnStore.userId;
          }
        }
      } else {
        const store = await Store.findOne({
          where: {
            companyId,
            storeType: "companyOwnStore",
          },
        });

        if (!store) {
          throw new Error(`No company owned store found!`);
        }

        storeId = store.userId;
      }

      const price = calculateDiscountedPrice(
        product.originalPrice,
        product.gst,
        product.pricerules?.[0]?.priceValue
      );

      const extraCharges =
        (product.handlingCharges || 0) +
        (product.shippingCharges || 0) +
        (product.otherCharges || 0);

      const discount = product.pricerules?.[0]?.priceValue
        ? (product.mrp || 0) -
          product.originalPrice -
          (product.originalPrice * product.pricerules?.[0]?.priceValue) / 100
        : (product.mrp || 0) - product.originalPrice;

      ordersData.push({
        bigOrderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        mrp: product.mrp || 0,
        price: price,
        gst: product.gst,
        subTotal: (price + extraCharges) * item.quantity,
        discount: discount,
        handlingCharges: product.handlingCharges || 0,
        shippingCharges: product.shippingCharges || 0,
        otherCharges: product.otherCharges || 0,
        remainingAmount: (price + extraCharges) * item.quantity,
        orderState: "processing",
        orderStatus: "pending",
        storeId: storeId,
        companyId: companyId,
      });

      if (orderUser === "distributor") {
        product.stockLevel = product.stockLevel - item.quantity;
        await product.save({ transaction });

        await StoreProductStock.decrement(
          { stockLevel: item.quantity },
          {
            where: {
              storeId: isStoreFound ? storeId : companyOwnStock.storeId,
              productId: item.productId,
              companyId: companyId,
            },
            transaction,
          }
        );
      }
    }

    const createdOrders = await BigOrderItem.bulkCreate(ordersData, {
      transaction,
    });

    const ordersHistory = [];

    for (const order of createdOrders) {
      ordersHistory.push({
        bigOrderItemId: order.id,
        status: "pending",
        orderState: "processing",
      });
    }

    await BigOrderStatusHistory.bulkCreate(ordersHistory, { transaction });

    await Cart.destroy({
      where: {
        userId: customerId,
        productId: {
          [Op.in]: productIds,
        },
      },
      transaction,
    });

    // Commit the transaction
    await transaction.commit();

    return createdOrders;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getOrders = async (
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {},
  customerId
) => {
  try {
    const offset = (page - 1) * limit;

    let whereClause = {
      [Op.and]: [
        sequelize.literal(
          `(SELECT COUNT(*) FROM order_products 
            WHERE order_products.orderItemId = OrderItem.id 
            AND order_products.status IN ('processing', 'return+processing')) > 0`
        ),
      ],
    };

    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    } else if (role === "platformUser") {
      whereClause["$order.customerId$"] = customerId;
    }

    if (filters.status) {
      whereClause.orderStatus = filters.status;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
      whereClause[Op.or] = [
        {
          "$order.customer.name$": {
            [Op.like]: `%${filters.searchTerm}%`,
          },
        },
        {
          "$deliveryAddress.city$": {
            [Op.like]: `%${filters.searchTerm}%`,
          },
        },
      ];
    }

    const { count, rows: orders } = await OrderItem.findAndCountAll({
      where: whereClause,
      attributes: ["id", "orderStatus", "createdAt", "trackId", "orderId"],
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "customer",
              attributes: ["name"],
            },
          ],
        },
        {
          model: DeliveryAddress,
          as: "deliveryAddress",
          attributes: ["city", "mobileNumber"],
        },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const results = orders.map((order) => ({
      id: order.id,
      showId: order.orderId,
      trackId: order.trackId,
      customerName: order.order.customer.name,
      mobileNumber: order.deliveryAddress.mobileNumber,
      status: order.orderStatus,
      orderDate: order.createdAt.toLocaleDateString(),
      location: order.deliveryAddress.city,
    }));

    return {
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
      data: results,
    };
  } catch (error) {
    throw new Error("Failed to fetch orders.");
  }
};

exports.getCancelOrders = async (
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {},
  customerId
) => {
  let whereClause = {};
  let cancelOrderWhereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  } else if (role === "platformUser") {
    cancelOrderWhereClause["$orderItem.order.customerId$"] = customerId;
  }

  if (
    ["pending", "accepted", "rejected", "refunded", "completed"].includes(
      filters.status
    )
  ) {
    cancelOrderWhereClause.orderStatus = filters.status;
  }

  if (filters.date) {
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);

    cancelOrderWhereClause.requestedAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
    cancelOrderWhereClause["$orderItem.order.customer.name$"] = {
      [Op.like]: `%${filters.searchTerm}%`,
    };
  }

  try {
    const offset = (page - 1) * limit;

    const { rows: orders, count } = await CancelOrder.findAndCountAll({
      attributes: [
        "id",
        "reason",
        "requestedAt",
        "orderStatus",
        "orderProductId",
      ],
      where: cancelOrderWhereClause,
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "createdAt", "orderId"],
          where: whereClause,
          include: [
            {
              model: Order,
              as: "order",
              attributes: ["id", "paymentMethod", "customerId", "createdAt"],
              include: [
                {
                  model: User,
                  as: "customer",
                  attributes: ["name"],
                },
              ],
            },
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
              attributes: ["mobileNumber"],
            },
          ],
        },
      ],
      order: [["requestedAt", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    return {
      data: orders.map((item) => ({
        joinId: [item.id, item.productId].join("_"),
        id: item.id,
        showId: item.orderItem.orderId,
        subId: item.orderProductId,
        productId: item.productId,
        orderId: item.orderItem.id,
        customerName: item.orderItem.order.customer.name,
        mobileNumber: item.orderItem.deliveryAddress.mobileNumber,
        orderDate: item.orderItem.order.createdAt.toLocaleDateString(),
        reason: item.reason,
        requestedAt: item.requestedAt.toLocaleDateString(),
        paymentMethod: item.orderItem.order.paymentMethod,
        status: item.orderStatus,
      })),
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getReturnOrders = async (
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {},
  customerId
) => {
  let whereClause = {};
  let returnOrderWhereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  } else if (role === "platformUser") {
    returnOrderWhereClause["$orderItem.order.customerId$"] = customerId;
  }

  if (
    [
      "pending",
      "accepted",
      "rejected",
      "pickUp",
      "received",
      "refunded",
      "completed",
    ].includes(filters.status)
  ) {
    returnOrderWhereClause.orderStatus = filters.status;
  }

  if (filters.date) {
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);

    returnOrderWhereClause.requestedAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  if (filters.searchTerm && filters.searchTerm.trim() !== "") {
    returnOrderWhereClause["$orderItem.order.customer.name$"] = {
      [Op.like]: `%${filters.searchTerm}%`,
    };
  }

  try {
    const offset = (page - 1) * limit;

    const { rows: orders, count } = await ReturnOrder.findAndCountAll({
      attributes: [
        "id",
        "reason",
        "requestedAt",
        "orderStatus",
        "orderProductId",
      ],
      where: returnOrderWhereClause,
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          attributes: ["id", "createdAt", "deliveredAt", "orderId"],
          where: whereClause,
          include: [
            {
              model: Order,
              as: "order",
              attributes: ["id", "paymentMethod", "customerId", "createdAt"],
              include: [
                {
                  model: User,
                  as: "customer",
                  attributes: ["name"],
                },
              ],
            },
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
              attributes: ["mobileNumber"],
            },
          ],
        },
      ],
      order: [["requestedAt", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    return {
      data: orders.map((item) => ({
        joinId: [item.id, item.productId].join("_"),
        id: item.id,
        productId: item.productId,
        orderId: item.orderItem.id,
        showId: item.orderItem.orderId,
        subId: item.orderProductId,
        customerName: item.orderItem.order.customer.name,
        mobileNumber: item.orderItem.deliveryAddress.mobileNumber,
        orderDate: item.orderItem.order.createdAt?.toLocaleDateString(),
        deliverDate: item.orderItem.deliveredAt?.toLocaleDateString(),
        reason: item.reason,
        requestedAt: item.requestedAt?.toLocaleDateString(),
        paymentMethod: item.orderItem.order.paymentMethod,
        status: item.orderStatus,
      })),
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigOrders = async (
  orderUser,
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    const offset = (page - 1) * limit;

    let whereClause = {
      orderState: {
        [Op.in]: ["processing", "processing+return"],
      },
    };
    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    }

    if (filters.status) {
      whereClause.orderStatus = filters.status;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      whereClause["$order.customer.name$"] = {
        [Op.like]: `%${filters.searchTerm}%`,
      };
    }

    const { rows: orders, count } = await BigOrderItem.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "createdAt",
        "quantity",
        "subTotal",
        "orderStatus",
        "remainingAmount",
        "bigOrderId",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["isPaid"],
          include: [
            {
              model: User,
              as: "customer",
              attributes: ["id", "name"],
            },
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
              attributes: ["mobileNumber"],
            },
          ],
          where: {
            orderUser: orderUser,
          },
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName"],
        },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const data = orders.map((item) => ({
      orderId: item.id,
      showId: item.bigOrderId,
      orderDate: item.createdAt.toLocaleDateString(),
      distributorName: item.order.customer.name,
      productName: item.product.productName,
      mobileNumber: item.order.deliveryAddress.mobileNumber,
      quantity: item.quantity,
      totalAmount: item.subTotal,
      orderStatus: item.orderStatus,
      paymentStatus:
        item.subTotal === item.remainingAmount
          ? "Pending"
          : item.remainingAmount == 0
          ? "Paid"
          : "Partially Paid",
    }));

    return {
      data,
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigCancelOrders = async (
  orderUser,
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    const offset = (page - 1) * limit;

    let whereClause = {
      orderState: "cancelled",
    };
    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    }

    if (filters.status) {
      whereClause.orderStatus = filters.status;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      whereClause["$order.customer.name$"] = {
        [Op.like]: `%${filters.searchTerm}%`,
      };
    }

    const { rows: orders, count } = await BigOrderItem.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "createdAt",
        "quantity",
        "subTotal",
        "orderStatus",
        "requestedAt",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["isPaid"],
          include: [
            {
              model: User,
              as: "customer",
              attributes: ["id", "name"],
            },
          ],
          where: {
            orderUser: orderUser,
          },
          required: true,
        },
      ],
      offset,
      limit,
      order: [["requestedAt", "DESC"]],
    });

    const data = orders.map((item) => ({
      orderId: item.id,
      distributorName: item.order.customer.name,
      quantity: item.quantity,
      totalAmount: item.subTotal,
      orderStatus: item.orderStatus,
      paymentStatus: item.order.isPaid ? "Paid" : "Not Paid",
    }));
    // Add remaining amount in the BigOrderItem remainingAmount

    return {
      data,
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigReturnOrders = async (
  orderUser,
  userId,
  role,
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    const offset = (page - 1) * limit;

    let whereClause = {
      orderState: {
        [Op.in]: ["return", "processing+return"],
      },
    };
    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    }

    if (filters.status) {
      whereClause.orderStatus = filters.status;
    }

    if (filters.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (filters.searchTerm && filters.searchTerm.trim() !== "") {
      whereClause["$order.customer.name$"] = {
        [Op.like]: `%${filters.searchTerm}%`,
      };
    }

    const { rows: orders, count } = await BigOrderItem.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "createdAt",
        "quantity",
        "subTotal",
        "orderStatus",
        "requestedAt",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["isPaid"],
          include: [
            {
              model: User,
              as: "customer",
              attributes: ["id", "name"],
            },
          ],
          where: {
            orderUser: orderUser,
          },
          required: true,
        },
      ],
      offset,
      limit,
      order: [["requestedAt", "DESC"]],
    });

    const data = orders.map((item) => ({
      orderId: item.id,
      distributorName: item.order.customer.name,
      quantity: item.quantity,
      totalAmount: item.subTotal,
      orderStatus: item.orderStatus,
      paymentStatus: item.order.isPaid ? "Paid" : "Not Paid",
    }));
    // Add remaining amount in the BigOrderItem remainingAmount

    return {
      data,
      pagination: {
        totalOrders: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigOrderDetails = async (orderId, userId, role) => {
  try {
    const whereClause = { id: orderId };
    const stockWhereClause = {};

    if (role === "store") {
      whereClause.storeId = userId;
      stockWhereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    }

    const order = await BigOrderItem.findOne({
      where: whereClause,
      attributes: [
        "id",
        "productId",
        "quantity",
        "subTotal",
        "orderStatus",
        "createdAt",
        "bigOrderId",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["isPaid"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName", "isBlock", "productStatus"],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    stockWhereClause.productId = order.productId;

    const stock = await StoreProductStock.findOne({
      where: stockWhereClause,
    });

    return {
      id: order.id,
      showId: order.bigOrderId,
      productId: order.productId,
      productName: order.product.productName,
      stockLevel: stock ? stock.stockLevel : 0,
      quantity: order.quantity,
      totalAmount: order.subTotal,
      orderStatus: order.orderStatus,
      paymentStatus: order.order.isPaid ? "paid" : "Not Paid",
      orderDate: order.createdAt.toLocaleDateString(),
    };
  } catch (error) {
    throw error;
  }
};

exports.getOrderDetails = async (orderId, userId, role) => {
  try {
    let whereClause = { id: orderId };
    const includes = [
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
      {
        model: OrderProduct,
        as: "products",
        attributes: [
          "quantity",
          "returnQuantity",
          "mrp",
          "price",
          "gst",
          "status",
          "handlingCharges",
          "shippingCharges",
          "otherCharges",
        ],
        where: {
          status: {
            [Op.in]: ["processing", "return+processing"],
          },
        },
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "productName"],
            include: [
              {
                model: ProductImage,
                as: "images",
              },
            ],
          },
        ],
      },
      {
        model: Order,
        attributes: ["id", "isPaid", "paymentMethod", "transactionId"],
        as: "order",
        include: [
          {
            model: User,
            attributes: ["name", "email", "mobileNumber"],
            as: "customer",
          },
        ],
      },
      {
        model: DeliveryAddress,
        attributes: [
          "pinCode",
          "state",
          "city",
          "district",
          "street",
          "baseAddress",
          "country",
        ],
        as: "deliveryAddress",
      },
      {
        model: OrderStatusHistory,
        attributes: ["status", "createdAt"],
        as: "orderStatusHistory",
        order: [["createdAt", "ASC"]],
      },
    ];

    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    } else {
      includes.push({
        model: Order,
        as: "order",
        attributes: [],
        where: {
          customerId: userId,
        },
      });
    }

    const order = await OrderItem.findOne({
      where: whereClause,
      attributes: ["id", "orderStatus", "subTotal", "createdAt"],
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    let totalAmount = 0;

    const products = order.products.map((item) => {
      const totalPrice =
        parseFloat(item.price * (item.quantity - item.returnQuantity)) + // item.quantity ==> item.quantity - item.returnQuantity
        parseFloat(item.handlingCharges) +
        parseFloat(item.shippingCharges) +
        parseFloat(item.otherCharges);
      totalAmount += totalPrice;

      return {
        id: item.id,
        productId: item.product.id,
        productName: item.product.productName,
        quantity: item.quantity - item.returnQuantity, // item.quantity ==> item.quantity - item.returnQuantity
        mrp: item.mrp,
        price: item.price,
        gst: item.gst,
        subTotal: totalPrice,
        image: `data:${
          item.product.images[0].contentType
        };base64,${item.product.images[0].image.toString("base64")}`,
      };
    });

    return {
      id: order.id,
      status: order.orderStatus,
      totalAmount,
      isPaid: order.order.isPaid,
      paymentMethod: order.order.paymentMethod,
      transactionId: order.order.transactionId,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      customer: {
        id: order.order.customer.id,
        name: order.order.customer.name,
        email: order.order.customer.email,
        mobileNumber: order.order.customer.mobileNumber,
      },
      deliveryAddress: {
        pinCode: order.deliveryAddress.pinCode,
        state: order.deliveryAddress.state,
        city: order.deliveryAddress.city,
        district: order.deliveryAddress.district,
        street: order.deliveryAddress.street,
        baseAddress: order.deliveryAddress.baseAddress,
        country: order.deliveryAddress.country,
      },
      products,
      orderStatusHistory: order.orderStatusHistory.map((status) => ({
        status: status.status,
        date: new Date(status.createdAt).toLocaleString(),
      })),
    };
  } catch (error) {
    throw error;
  }
};

exports.getProcessingOrderDetails = async (
  orderId,
  productId,
  userId,
  role
) => {
  const whereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  }

  try {
    const order = await OrderProduct.findOne({
      where: {
        orderItemId: orderId,
        productId,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: whereClause,
          include: [
            {
              model: OrderStatusHistory,
              as: "orderStatusHistory",
            },
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
            {
              model: Company,
              as: "company",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name"],
                },
              ],
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
              required: false,
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
          include: [
            {
              model: ProductImage,
              as: "images",
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      invoiceId: order.id,
      orderId: order.orderItemId,
      showId: order.orderItem.orderId,
      subId: order.id,
      orderStatus: order.orderItem.orderStatus,
      courierCompanyId: order.orderItem.courierCompanyId,
      trackId: order.orderItem.trackId,
      note: order.orderItem.note,
      productId: order.productId,
      orderDate: order.orderItem.createdAt.toLocaleDateString(),
      // store: order.orderItem.user,
      // company: order.orderItem.company,
      soldBy: order.orderItem.user?.name || order.orderItem.company.user.name,
      product: {
        productId: order.productId,
        productName: order.product.productName,
        mrp: order.mrp,
        price: order.price,
        gst: order.gst,
        quantity: order.quantity - order.returnQuantity, // order.quantity ==> order.quantity - order.returnQuantity
        subTotal: order.price * order.quantity,
        orderDate: order.orderItem.createdAt.toLocaleDateString(),
        image: `data:${
          order.product.images[0].contentType
        };base64,${order.product.images[0].image.toString("base64")}`,
      },
      deliveryAddress: order.orderItem.deliveryAddress,
      orderStatusHistory: order.orderItem.orderStatusHistory.map((item) => ({
        status: item.status,
        date: item.createdAt.toLocaleString(),
      })),
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigProcessingOrderDetails = async (
  orderId,
  userId,
  role,
  orderType
) => {
  const whereClause = {
    id: orderId,
    "$orderStatusHistory.orderState$": orderType,
  };
  const includes = [
    {
      model: BigOrderStatusHistory,
      as: "orderStatusHistory",
      order: [["createdAt", "DESC"]],
    },
    {
      model: Product,
      as: "product",
      attributes: ["productName"],
      include: [
        {
          model: ProductImage,
          as: "images",
        },
      ],
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"],
      required: false,
    },
    {
      model: Company,
      as: "company",
      attributes: [],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
    },
    {
      model: BigOrder,
      as: "order",
      include: [
        {
          model: DeliveryAddress,
          as: "deliveryAddress",
        },
      ],
    },
  ];

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  } else {
    whereClause["$order.customerId$"] = userId;
  }

  try {
    const order = await BigOrderItem.findOne({
      where: {
        id: orderId,
      },
      attributes: [
        "id",
        "orderStatus",
        "productId",
        "mrp",
        "price",
        "gst",
        "quantity",
        "subTotal",
        "createdAt",
        "bigOrderId",
      ],
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      invoiceId: order.id,
      showId: order.bigOrderId,
      orderId: order.id,
      orderStatus: order.orderStatus,
      productId: order.productId,
      orderDate: order.createdAt.toLocaleDateString(),
      soldBy: order.user?.name || order.company?.user.name,
      product: {
        productId: order.productId,
        productName: order.product.productName,
        mrp: order.mrp,
        price: order.price,
        gst: order.gst,
        quantity: order.quantity,
        subTotal: order.subTotal,
        orderDate: order.createdAt.toLocaleDateString(),
        image: `data:${
          order.product.images[0].contentType
        };base64,${order.product.images[0].image.toString("base64")}`,
      },
      deliveryAddress: order.deliveryAddress,
      orderStatusHistory: order.orderStatusHistory.map((item) => ({
        status: item.status,
        date: item.createdAt.toLocaleString(),
      })),
    };
  } catch (error) {
    throw error;
  }
};

exports.getCancelOrderDetails = async (orderId, userId, role) => {
  const whereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  }

  try {
    const order = await CancelOrder.findOne({
      where: {
        id: orderId,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: whereClause,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["productName"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                },
              ],
            },
          ],
        },
        {
          model: CancelOrderStatusHistory,
          as: "statusHistory",
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      id: order.orderProduct.id,
      orderId: order.orderItemId,
      showId: order.orderItem.orderId,
      subId: order.orderProductId,
      orderStatus: order.orderStatus,
      productId: order.productId,
      orderDate: order.orderItem.createdAt.toLocaleDateString(),
      product: {
        productId: order.productId,
        productName: order.orderProduct.product.productName,
        mrp: order.orderProduct.mrp,
        price: order.orderProduct.price,
        gst: order.orderProduct.gst,
        quantity: order.orderProduct.quantity,
        subTotal: order.orderProduct.price * order.orderProduct.quantity,
        orderDate: order.orderItem.createdAt.toLocaleDateString(),
        image: `data:${
          order.orderProduct.product.images[0].contentType
        };base64,${order.orderProduct.product.images[0].image.toString(
          "base64"
        )}`,
      },
      orderStatusHistory: order.statusHistory.map((item) => ({
        status: item.status,
        date: item.createdAt.toLocaleString(),
      })),
    };
  } catch (error) {
    throw error;
  }
};

exports.getReturnOrderDetails = async (orderId, userId, role) => {
  const whereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  }

  try {
    const order = await ReturnOrder.findOne({
      where: {
        id: orderId,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: whereClause,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["productName"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                },
              ],
            },
          ],
        },
        {
          model: ReturnOrderStatusHistory,
          as: "statusHistory",
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      invoiceId: order.orderProduct.id,
      id: order.orderProductId,
      orderId: order.orderItemId,
      showId: order.orderItem.orderId,
      subId: order.orderProductId,
      orderStatus: order.orderStatus,
      productId: order.productId,
      orderDate: order.orderItem.createdAt.toLocaleDateString(),
      product: {
        productId: order.productId,
        productName: order.orderProduct.product.productName,
        mrp: order.orderProduct.mrp,
        price: order.orderProduct.price,
        gst: order.orderProduct.gst,
        quantity: order.returnQuantity,
        subTotal: order.orderProduct.price * order.returnQuantity,
        orderDate: order.orderItem.createdAt.toLocaleDateString(),
        image: `data:${
          order.orderProduct.product.images[0].contentType
        };base64,${order.orderProduct.product.images[0].image.toString(
          "base64"
        )}`,
      },
      orderStatusHistory: order.statusHistory.map((item) => ({
        status: item.status,
        date: item.createdAt.toLocaleString(),
      })),
    };
  } catch (error) {
    throw error;
  }
};

exports.changeOrderStatus = async (data) => {
  const {
    userId,
    role,
    orderId,
    newStatus,
    reason,
    shipDate,
    trackId,
    warrantyCode,
    note,
    courierCompanyId,
    returnQuantity,
    images,
    productId,
  } = data;

  const transaction = await sequelize.transaction();
  try {
    let whereClause = { id: orderId };
    const includes = [];

    if (role === "store") {
      whereClause.storeId = userId;
    }

    if (
      (newStatus === "cancelled" || newStatus === "return") &&
      role === "customer"
    ) {
      includes.push({
        model: Order,
        as: "order",
        where: {
          customerId: userId,
        },
      });
      includes.push({
        model: OrderProduct,
        as: "products",
        where: { productId },
        required: true,
      });
    }

    const order = await OrderItem.findOne({
      where: whereClause,
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found!");
    }

    const product = order.products?.[0];

    if (!product) {
      let currentStatus = order.orderStatus;
      const validNextStatuses =
        processingAllowedTransitions[currentStatus] || [];

      if (!validNextStatuses.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}.`
        );
      }

      order.orderStatus = newStatus;
      if (newStatus === "completed") {
        order.deliveredAt = new Date();
        const orderProducts = await OrderProduct.findAll({
          where: {
            orderItemId: order.id,
          },
        });

        for (const order_product of orderProducts) {
          const returnDays = order_product.returnDays || 0;
          const returnDate = new Date();
          returnDate.setDate(returnDate.getDate() + returnDays);

          const warrantyDays = order_product.warrantyDays || 0;
          const warrantyDate = new Date();
          warrantyDate.setDate(warrantyDate.getDate() + warrantyDays);

          await order_product.update(
            {
              returnDate,
              warrantyExpiresAt: warrantyDate,
            },
            {
              transaction,
            }
          );
        }
      } else if (newStatus === "readyToDispatch") {
        order.shipDate = shipDate;
        order.trackId = trackId;
        order.note = note;
        order.courierCompanyId = courierCompanyId;

        const warrantyProducts = await this.getWarrantyProducts(order.id);

        const warrantyCodeMap = new Map();
        for (const code of warrantyCode) {
          warrantyCodeMap.set(code.orderProductId, code.warrantyCode);
        }

        for (const wp of warrantyProducts) {
          const code = warrantyCodeMap.get(wp.orderProductId.toString());
          if (!code || code.length != wp.quantity) {
            throw new Error(
              "Please provide warranty codes for all warranty products"
            );
          }

          await OrderProduct.update(
            {
              warrantyCode: code,
            },
            {
              where: {
                id: wp.orderProductId,
              },
              transaction,
            }
          );
        }
      }

      await order.save({ transaction });

      await OrderStatusHistory.create(
        {
          orderItemId: order.id,
          status: newStatus,
        },
        {
          transaction,
        }
      );

      await transaction.commit();

      return {
        id: order.id,
        status: order.orderStatus,
        updatedAt: new Date(order.updatedAt).toLocaleDateString(),
      };
    }

    if (product.status === "cancelled" || product.status === "return") {
      throw new Error(`Product is already ${product.status}`);
    }

    if (newStatus === "cancelled") {
      if (order.orderStatus === "completed") {
        throw new Error("Cannot cancel a completed order");
      }
      if (
        ["readyToDispatch", "inTransit", "completed", "return"].includes(
          order.orderStatus
        )
      ) {
        throw new Error("Cannot cancel an order that has been shipped.");
      }
      const isExists = await CancelOrder.findOne({
        where: {
          orderItemId: orderId,
          orderProductId: product.id,
        },
      });

      if (isExists) {
        throw new Error("Cancel request already exists");
      }

      const cancelOrder = await CancelOrder.create(
        {
          orderItemId: orderId,
          orderProductId: product.id,
          reason,
          orderStatus: "pending",
          requestedAt: new Date(),
        },
        {
          transaction,
        }
      );
      await CancelOrderStatusHistory.create(
        {
          cancelOrderId: cancelOrder.id,
          status: "pending",
        },
        {
          transaction,
        }
      );
      await OrderProduct.update(
        {
          isCancel: true,
        },
        {
          where: {
            orderItemId: order.id,
            productId,
          },
          transaction,
        }
      );
    } else {
      if (order.orderStatus !== "completed") {
        throw new Error("Order is not completed");
      }
      if (product.returnDate < new Date()) {
        throw new Error(
          `Return policy ended on ${new Date(product.returnDate).toUTCString()}`
        );
      }
      if (product.quantity < returnQuantity) {
        throw new Error("Insufficient quantity for return.");
      }

      const isExists = await ReturnOrder.findOne({
        where: {
          orderItemId: orderId,
          orderProductId: product.id,
        },
      });

      if (isExists) {
        throw new Error("Return request already exists");
      }

      const returnOrder = await ReturnOrder.create(
        {
          orderItemId: orderId,
          orderProductId: product.id,
          reason,
          orderStatus: "pending",
          requestedAt: new Date(),
          returnQuantity,
          // Add note field in db
        },
        {
          transaction,
        }
      );

      await ReturnOrderStatusHistory.create(
        {
          returnOrderId: returnOrder.id,
          status: "pending",
        },
        {
          transaction,
        }
      );

      const returnImagesData = images.map((image) => ({
        image: image.buffer,
        contentType: image.mimetype,
        returnOrderId: returnOrder.id,
      }));

      await ReturnImage.bulkCreate(returnImagesData, {
        transaction,
      });
    }

    await transaction.commit();

    return {
      id: order.orderId,
      productId,
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.changeStatusOfCancelOrder = async (
  orderId,
  userId,
  role,
  newStatus,
  data
) => {
  const { refundAmount, transactionId } = data ? data : {};
  let whereClause = {};

  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  } else {
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await CancelOrder.findOne({
      where: {
        id: orderId,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: whereClause,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          attributes: ["productId", "quantity"],
        },
      ],
      transaction,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let currentStatus = order.orderStatus;
    const validNextStatuses = cancelAllowedTransitions[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}.`
      );
    }
    order.orderStatus = newStatus;
    if (newStatus === "accepted") {
      await OrderProduct.update(
        {
          status: "cancelled",
        },
        {
          where: {
            id: order.orderProductId,
          },
          transaction,
        }
      );
    } else if (newStatus === "refunded") {
      order.refundAmount = refundAmount;
      order.transactionId = transactionId;

      const orderProduct = await OrderProduct.findOne({
        where: {
          orderItemId: order.orderItemId,
          productId: order.orderProduct.productId,
        },
        transaction,
      });

      // Update product stock in a single query
      await Product.increment(
        { stockLevel: orderProduct.quantity },
        {
          where: { id: order.orderProduct.productId },
          transaction,
        }
      );

      // Update store stock directly
      await StoreProductStock.increment(
        { stockLevel: orderProduct.quantity },
        {
          where: {
            storeId: order.orderItem.storeId,
            productId: order.orderProduct.productId,
            companyId: order.orderItem.companyId,
          },
          transaction,
        }
      );
    }

    await order.save({ transaction });

    await CancelOrderStatusHistory.create(
      {
        cancelOrderId: orderId,
        status: newStatus,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return {
      id: order.id,
      status: order.orderStatus,
      updatedAt: order.updatedAt.toLocaleDateString(),
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.changeStatusOfReturnOrder = async (
  orderId,
  userId,
  role,
  newStatus,
  data
) => {
  const {
    pickUpDate,
    pickUpTime,
    courierCompanyId,
    trackId,
    transactionId,
    refundAmount,
    courierAmount,
    otherAmount,
    handlingAmount,
    comment,
  } = data ? data : {};
  const whereClause = {};
  if (role === "store") {
    whereClause.storeId = userId;
  } else if (role === "orderManager") {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
  }

  const transaction = await sequelize.transaction();

  try {
    const order = await ReturnOrder.findOne({
      where: {
        id: orderId,
      },
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: whereClause,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          attributes: ["productId"],
        },
      ],
      transaction,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let currentStatus = order.orderStatus;
    const validNextStatuses = returnAllowedTransitions[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}.`
      );
    }

    order.orderStatus = newStatus;

    if (newStatus === "accepted") {
      const orderProduct = await OrderProduct.findOne({
        where: {
          id: order.orderProductId,
        },
        transaction,
      });
      const newStatus =
        order.returnQuantity === orderProduct.quantity
          ? "return"
          : "return+processing";
      await orderProduct.update(
        {
          status: newStatus,
          returnQuantity: order.returnQuantity,
        },
        {
          transaction,
        }
      );
    } else if (newStatus === "pickUp") {
      order.pickUpDate = pickUpDate;
      order.pickUpTime = pickUpTime;
      order.courierCompanyId = courierCompanyId;
      order.trackId = trackId;
    } else if (newStatus === "refunded") {
      order.transactionId = transactionId;
      order.refundAmount = refundAmount;
      order.courierAmount = courierAmount;
      order.otherAmount = otherAmount;
      order.handlingAmount = handlingAmount;
      order.comment = comment;

      await Product.increment(
        { stockLevel: order.returnQuantity },
        {
          where: { id: order.orderProduct.productId },
          transaction,
        }
      );
      await StoreProductStock.increment(
        { stockLevel: order.returnQuantity },
        {
          where: {
            storeId: order.orderItem.storeId,
            productId: order.orderProduct.productId,
            companyId: order.orderItem.companyId,
          },
          transaction,
        }
      );
    }

    await order.save({ transaction });

    await ReturnOrderStatusHistory.create(
      {
        returnOrderId: orderId,
        status: newStatus,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return {
      id: order.id,
      status: order.orderStatus,
      updatedAt: order.updatedAt.toLocaleDateString(),
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

exports.getReturnImages = async (orderId) => {
  const order = await Order.findOne({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found.");
  }
  const returnImages = await ReturnImage.findAll({
    where: { orderItemId: orderId },
  });

  return returnImages.map((image) => ({
    id: image.id,
    image: `data:${image.contentType};base64,${image.image.toString("base64")}`,
  }));
};

exports.generateLabel = async (orderId, userId, role) => {
  const whereClause = { id: orderId };
  const includes = [
    {
      model: Order,
      as: "order",
      attributes: ["paymentMethod"],
    },
    {
      model: OrderProduct,
      as: "products",
      attributes: ["id", "quantity"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["height", "width", "weight", "length"],
        },
      ],
    },
    {
      model: DeliveryAddress,
      as: "deliveryAddress",
    },
  ];

  if (role === "store") {
    whereClause.storeId = userId;
    includes.push({
      model: User,
      as: "user",
      attributes: ["id", "name", "email", "mobileNumber"],
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
          ],
        },
      ],
    });
  } else {
    const storeIds = await getCompanyOwnStore(userId);
    whereClause.storeId = {
      [Op.in]: storeIds,
    };
    includes.push({
      model: Company,
      as: "company",
      attributes: [
        "companyName",
        "primaryPinCode",
        "primaryState",
        "primaryDistrict",
        "companyAddress",
        "city",
        "gstNumber",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "mobileNumber"],
        },
      ],
    });
  }

  try {
    const order = await OrderItem.findOne({
      where: whereClause,
      attributes: ["courierCompanyId", "trackId", "shipDate", "subTotal"],
      include: includes,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let weight = 0;
    for (const item of order.products) {
      weight += item.product.weight * item.quantity;
    }

    return {
      courierCompanyId: order.courierCompanyId,
      declaredValue: order.subTotal,
      trackId: order.trackId,
      paymentMethod: order.order.paymentMethod,
      companyAddress:
        role === "store"
          ? {
              companyName: order.user.name,
              pinCode: order.user.store.pinCode,
              street: order.user.store.street,
              state: order.user.store.state,
              baseAddress: order.user.store.address,
              city: order.user.store.city,
              district: order.user.store.district,
              state: order.user.store.district,
              country: order.user.store.country,
              email: order.user.email,
              mobileNumber: order.user.mobileNumber,
            }
          : {
              companyName: order.company.companyName,
              pinCode: order.company.primaryPinCode,
              street: order.company.companyAddress,
              state: order.company.primaryState,
              baseAddress: order.company.companyAddress,
              city: order.company.city,
              district: order.company.primaryDistrict,
              state: order.company.primaryState,
              country: "India",
              email: order.company.user.email,
              mobileNumber: order.company.user.mobileNumber,
              gstNumber: decryptSensitiveData(order.company.gstNumber),
            },
      deliveryAddress: order.deliveryAddress,
      shippingDate: order.shipDate?.toLocaleDateString(),
      weight: weight,
    };
  } catch (error) {
    throw error;
  }
};

exports.changeBigOrderStatus = async (data) => {
  const {
    userId,
    role,
    orderId,
    newStatus,
    reason,
    shipDate,
    trackId,
    warrantyCode,
    note,
    courierCompanyId,
    transactionId,
    returnQuantity,
    images,
    pickUpDate,
    pickUpTime,
    returnCourierCompanyId,
    returnTrackId,
    refundAmount,
    courierAmount,
    otherAmount,
    handlingAmount,
    comment,
  } = data;

  const transaction = await sequelize.transaction();
  try {
    let whereClause = { id: orderId };
    const includes = [];

    if (role === "store") {
      whereClause.storeId = userId;
    } else if (role === "orderManager") {
      const storeIds = await getCompanyOwnStore(userId);
      whereClause.storeId = {
        [Op.in]: storeIds,
      };
    } else {
      includes.push({
        model: BigOrder,
        as: "order",
        where: {
          customerId: userId,
        },
        required: true,
      });
    }

    // Fetch the order
    const order = await BigOrderItem.findOne(
      { where: whereClause, include: includes },
      { transaction }
    );

    if (!order) {
      throw new Error("Order not found!");
    }

    // Validate the status transition
    let currentStatus = order.orderStatus;

    if (order.orderState === "processing") {
      const validNextStatuses =
        processingAllowedTransitions[currentStatus] || [];

      if (!validNextStatuses.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}.`
        );
      }
      if (newStatus !== "return") order.orderStatus = newStatus;
      if (newStatus === "cancelled") {
        order.reason = reason;
        order.orderState = "cancelled";
        order.orderStatus = "pending";
        order.requestedAt = new Date();
      } else if (newStatus === "return") {
        if (returnQuantity > order.quantity) {
          throw new Error("Return quantity exceeds order quantity");
        }

        order.reason = reason;
        order.returnQuantity = returnQuantity;
        order.orderState =
          returnQuantity == order.quantity ? "return" : "processing+return";
        order.returnStatus = "pending";
        order.requestedAt = new Date();
        const returnImagesData = images.map((image) => ({
          image: image.buffer,
          contentType: image.mimetype,
          bigOrderItemId: order.id,
        }));
        await ReturnImage.bulkCreate(returnImagesData, { transaction });
      } else if (newStatus === "readyToDispatch") {
        order.shipDate = shipDate;
        order.trackId = trackId;
        order.warrantyCode = warrantyCode;
        order.note = note;
        order.courierCompanyId = courierCompanyId;
      } else if (newStatus === "completed") {
        order.deliveredAt = new Date();
      }
    } else if (order.orderState === "cancelled") {
      const validNextStatuses = cancelAllowedTransitions[currentStatus] || [];
      if (!validNextStatuses.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}.`
        );
      }
      order.orderStatus = newStatus;
      if (newStatus === "refunded") {
        order.refundAmount = refundAmount;
        order.transactionId = transactionId;
      } else if (newStatus === "completed") {
        const product = await Product.findByPk(order.productId);
        if (product) {
          product.stockLevel += order.quantity;
          await product.save({ transaction });
        }
      }
    } else if (
      order.orderState === "return" ||
      order.orderState === "processing+return"
    ) {
      currentStatus = order.returnStatus;
      const validNextStatuses = returnAllowedTransitions[currentStatus] || [];
      if (!validNextStatuses.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}.`
        );
      }
      order.returnStatus = newStatus;
      if (newStatus === "accepted") {
      } else if (newStatus === "pickUp") {
        order.pickUpDate = pickUpDate;
        order.pickUpTime = pickUpTime;
        order.returnCourierCompanyId = returnCourierCompanyId;
        order.returnTrackId = returnTrackId;
      } else if (newStatus === "refunded") {
        order.transactionId = transactionId;
        order.returnRefundAmount = refundAmount;
        order.courierAmount = courierAmount;
        order.otherAmount = otherAmount;
        order.handlingAmount = handlingAmount;
        order.comment = comment;
      } else if (newStatus === "completed") {
        await Product.increment(
          {
            stockLevel: order.returnQuantity,
          },
          {
            where: {
              id: order.productId,
            },
            transaction,
          }
        );
        await StoreProductStock.increment(
          {
            stockLevel: order.returnQuantity,
          },
          {
            where: {
              storeId: order.storeId,
              productId: order.productId,
              companyId: order.companyId,
            },
          }
        );
      }
    }

    await order.save({ transaction });

    await BigOrderStatusHistory.create(
      {
        bigOrderItemId: order.id,
        status:
          newStatus === "cancelled" || newStatus === "return"
            ? "pending"
            : newStatus,
        orderState: order.orderState,
      },
      {
        transaction,
      }
    );

    // Commit the transaction
    await transaction.commit();

    return {
      id: order.id,
      status: order.orderStatus,
      updatedAt: new Date(order.updatedAt).toLocaleDateString(),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getCustomerOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = { customerId: userId };

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }

  try {
    const orders = await Order.findAll({
      where: whereClause,
      attributes: [
        "id",
        "createdAt",
        [
          sequelize.literal(`(
            SELECT COUNT(DISTINCT op.productId)
            FROM order_products AS op
            JOIN order_items AS oi ON oi.id = op.orderItemId
            WHERE oi.orderId = Order.id
            AND op.status IN ('processing', 'return+processing') AND op.isCancel = false
          )`),
          "productCount",
        ],
        [
          sequelize.literal(`(
            SELECT SUM(
              (op.price + op.handlingCharges + op.shippingCharges + op.otherCharges) * (op.quantity - op.returnQuantity)
            )
            FROM order_products AS op
            JOIN order_items AS oi ON oi.id = op.orderItemId
            WHERE oi.orderId = Order.id
            AND op.status IN ('processing', 'return+processing') AND op.isCancel = false
          )`),
          "totalAmount",
        ],
        [
          sequelize.literal(`(
            SELECT img.image
            FROM product_images AS img
            JOIN products AS p ON img.productId = p.id
            JOIN order_products AS op ON op.productId = p.id
            JOIN order_items AS oi ON oi.id = op.orderItemId
            WHERE oi.orderId = Order.id
            LIMIT 1
          )`),
          "image",
        ],
        [
          sequelize.literal(`(
            SELECT img.contentType
            FROM product_images AS img
            JOIN products AS p ON img.productId = p.id
            JOIN order_products AS op ON op.productId = p.id
            JOIN order_items AS oi ON oi.id = op.orderItemId
            WHERE oi.orderId = Order.id
            LIMIT 1
          )`),
          "contentType",
        ],
      ],
      include: [
        {
          model: OrderItem,
          attributes: [],
          as: "items",
          include: [
            {
              model: OrderProduct,
              attributes: [],
              as: "products",
              required: true,
              where: {
                status: {
                  [Op.in]: ["processing", "return+processing"],
                },
              },
              include: [
                {
                  model: Product,
                  attributes: [],
                  as: "product",
                  include: [
                    {
                      model: ProductImage,
                      attributes: [],
                      as: "images",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      group: ["Order.id"],
      having: sequelize.literal("productCount > 0"),
      order: [["createdAt", "DESC"]],
    });

    return orders.map((item) => ({
      id: item.id,
      showId: item.id,
      orderDate: item.createdAt.toLocaleDateString(),
      totalAmount: item.get("totalAmount"),
      totalItems: item.get("productCount"),
      image:
        `data:${item.get("contentType")};base64,${item
          .get("image")
          ?.toString("base64")}` || null,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getBigCustomerOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = { customerId: userId };

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }

  try {
    const orders = await BigOrder.findAll({
      where: whereClause,
      attributes: [
        "id",
        "createdAt",
        [
          sequelize.literal(`(
            SELECT COUNT(DISTINCT boi.productId)
            FROM big_order_items AS boi
            WHERE boi.bigOrderId = BigOrder.id
            AND boi.orderState IN ('processing', 'processing+return')
          )`),
          "totalItems",
        ],
        [
          sequelize.literal(`(
            SELECT SUM(
              (boi.price + boi.handlingCharges + boi.shippingCharges + boi.otherCharges) * boi.quantity
            )
            FROM big_order_items AS boi
            WHERE boi.bigOrderId = BigOrder.id
            AND boi.orderState IN ('processing', 'processing+return')
          )`),
          "totalAmount",
        ],
        [
          sequelize.literal(`(
            SELECT img.image
            FROM product_images AS img
            JOIN products AS p ON img.productId = p.id
            JOIN big_order_items AS boi ON boi.productId = p.id
            WHERE boi.bigOrderId = BigOrder.id
            LIMIT 1
          )`),
          "image",
        ],
        [
          sequelize.literal(`(
            SELECT img.contentType
            FROM product_images AS img
            JOIN products AS p ON img.productId = p.id
            JOIN big_order_items AS boi ON boi.productId = p.id
            WHERE boi.bigOrderId = BigOrder.id
            LIMIT 1
          )`),
          "contentType",
        ],
      ],
      having: sequelize.literal("totalItems > 0"),
      order: [["createdAt", "DESC"]],
    });

    const data = orders.map((order) => ({
      id: order.id,
      showId: order.id,
      orderDate: order.createdAt.toLocaleDateString(),
      totalItems: order.get("totalItems"),
      totalAmount: order.get("totalAmount"),
      image:
        `data:${order.get("contentType")};base64,${order
          .get("image")
          ?.toString("base64")}` || null,
    }));

    return data;
  } catch (error) {
    throw error;
  }
};

exports.getOrderProducts = async (id, userId) => {
  try {
    const orderProduct = await OrderProduct.findAll({
      attributes: [
        "id",
        "price",
        "quantity",
        "returnQuantity",
        "productId",
        "orderItemId",
        "handlingCharges",
        "shippingCharges",
        "otherCharges",
      ],
      where: {
        status: {
          [Op.in]: ["processing", "return+processing"],
        },
        isCancel: false,
      },
      include: [
        {
          model: OrderItem,
          attributes: [
            "id",
            "createdAt",
            "orderStatus",
            "deliveredAt",
            "orderId",
          ],
          as: "orderItem",
          include: [
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
            {
              model: Order,
              attributes: ["id", "customerId"],
              as: "order",
              where: {
                id,
                customerId: userId,
              },
              required: true,
            },
            {
              model: User,
              attributes: ["name"],
              as: "user",
            },
            {
              model: Company,
              attributes: ["companyName"],
              as: "company",
            },
          ],
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName", "returnOption"],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["id", "image", "contentType"],
              limit: 1,
            },
          ],
        },
        {
          model: Review,
          as: "productReview",
          attributes: ["review", "rating"],
        },
      ],
    });

    let totalAmount = 0;

    const data = orderProduct.map((item) => {
      totalAmount +=
        (parseFloat(item.price) +
          parseFloat(item.handlingCharges) +
          parseFloat(item.shippingCharges) +
          parseFloat(item.otherCharges)) *
        (item.quantity - item.returnQuantity);

      return {
        id: item.id,
        joinId: [item.orderItemId, item.productId].join("_"),
        orderId: item.orderItemId,
        orderStatus: item.orderItem.orderStatus,
        orderDate: item.orderItem.createdAt.toLocaleDateString(),
        deliverDate: item.orderItem.deliveredAt?.toLocaleDateString(),
        orderStatus: item.orderItem.orderStatus,
        productId: item.productId,
        productName: item.product.productName,
        soldBy:
          item.orderItem?.user?.name || item.orderItem?.company?.companyName,
        price: item.price,
        quantity: item.quantity - item.returnQuantity,
        rating: item.productReview?.rating,
        review: item.productReview?.review,
        returnOption: item.product.returnOption,
        handlingCharges: item.handlingCharges,
        shippingCharges: item.shippingCharges,
        otherCharges: item.otherCharges,
        image: `data:${
          item?.product?.images?.[0]?.contentType
        };base64,${item?.product?.images[0]?.image.toString("base64")}`,
      };
    });

    return {
      id: orderProduct[0].orderItem.orderId,
      orderDate: data[0].orderDate,
      totalAmount: parseFloat(totalAmount).toFixed(2),
      deliveryAddress: orderProduct[0].orderItem.deliveryAddress,
      data,
    };
  } catch (error) {
    throw error;
  }
};

exports.getBigOrderProducts = async (id, userId) => {
  try {
    const orders = await BigOrderItem.findAll({
      where: {
        orderState: {
          [Op.or]: ["processing", "processing+return"],
        },
      },
      attributes: [
        "id",
        "orderStatus",
        "price",
        "quantity",
        "subTotal",
        "createdAt",
        "deliveredAt",
        "bigOrderId",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["totalAmount"],
          where: {
            id,
            customerId: userId,
          },
          include: [
            {
              model: DeliveryAddress,
              as: "deliveryAddress",
            },
          ],
          required: true,
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "productName", "returnOption"],
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["image", "contentType"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
        {
          model: Company,
          as: "company",
          attributes: ["id", "companyName"],
        },
        {
          model: Review,
          as: "productReview",
          attributes: ["review", "rating"],
        },
      ],
    });

    const data = orders.map((item) => ({
      id: item.id,
      joinId: item.id,
      showId: item.bigOrderId,
      orderStatus: item.orderStatus,
      price: item.price,
      quantity: item.quantity,
      review: item.productReview?.review,
      rating: item.productReview?.rating,
      orderDate: item.createdAt.toLocaleDateString(),
      deliverDate: item.deliveredAt?.toLocaleDateString(),
      productId: item.product.id,
      productName: item.product.productName,
      returnOption: item.product.returnOption,
      soldBy: item.user?.name || item.company.companyName,
      image: `data:${
        item.product.images[0].contentType
      };base64,${item.product.images[0].image.toString("base64")}`,
    }));

    return {
      id: data[0]?.id,
      showId: data[0]?.showId,
      orderDate: data[0]?.orderDate,
      ...orders[0]?.order?.toJSON(),
      data,
    };
  } catch (error) {
    throw error;
  }
};

exports.getCustomerCancelOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = {};

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }

  try {
    const orders = await CancelOrder.findAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          include: [
            {
              model: Order,
              as: "order",
              where: {
                customerId: userId,
              },
              required: true,
            },
          ],
          required: true,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          include: [
            {
              model: Product,
              attributes: ["productName"],
              as: "product",
              include: [
                {
                  model: ProductImage,
                  as: "images",
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return orders.map((item) => ({
      joinId: item.id,
      orderId: item.orderItemId,
      showId: item.orderItem.orderId,
      subId: item.orderProductId,
      productId: item.productId,
      productName: item.orderProduct.product.productName,
      quantity: item.orderProduct.quantity,
      price: item.orderProduct.price,
      orderStatus: item.orderStatus,
      orderDate: item.orderItem.createdAt.toLocaleDateString(),
      // deliverDate: item.orderItem.deliveredAt?.toLocaleDateString() || null,
      image: `data:${
        item.orderProduct.product.images[0].contentType
      };base64,${item.orderProduct.product.images[0].image.toString("base64")}`,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getBigCustomerCancelOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = { orderState: "cancelled" };

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }
  try {
    const orders = await BigOrderItem.findAll({
      where: whereClause,
      attributes: [
        "id",
        "price",
        "quantity",
        "orderStatus",
        "createdAt",
        "deliveredAt",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["id", "customerId"],
          where: {
            customerId: userId,
          },
          required: true,
        },
        {
          model: Product,
          attributes: ["id", "productName"],
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["image", "contentType"],
            },
          ],
        },
      ],
    });

    return orders.map((item) => ({
      orderId: item.id,
      joinId: item.id,
      price: item.price,
      quantity: item.quantity,
      orderDate: item.createdAt.toLocaleDateString(),
      deliverDate: item.deliveredAt?.toLocaleDateString(),
      orderStatus: item.orderStatus,
      productName: item.product.productName,
      image: `data:${
        item.product.images[0].contentType
      };base64,${item.product.images[0].image.toString("base64")}`,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getCustomerReturnOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = {};

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }

  try {
    const orders = await ReturnOrder.findAll({
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          include: [
            {
              model: Order,
              as: "order",
              where: {
                customerId: userId,
              },
              required: true,
            },
          ],
          required: true,
        },
        {
          model: OrderProduct,
          as: "orderProduct",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["productName"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return orders.map((item) => ({
      joinId: item.id,
      // joinId: [item.orderItemId, item.productId].join("_"),
      orderId: item.orderItemId,
      showId: item.orderItem.orderId,
      subId: item.orderProductId,
      productId: item.productId,
      productName: item.orderProduct.product.productName,
      // quantity: item.orderProduct.quantity,
      quantity: item.returnQuantity,
      price: item.orderProduct.price,
      orderStatus: item.orderStatus,
      orderDate: item.orderItem.createdAt.toLocaleDateString(),
      deliverDate: item.orderItem.deliveredAt?.toLocaleDateString() || null,
      image: `data:${
        item.orderProduct.product.images[0].contentType
      };base64,${item.orderProduct.product.images[0].image.toString("base64")}`,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getBigCustomerReturnOrders = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = {
    orderState: {
      [Op.in]: ["return", "processing+return"],
    },
  };

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }
  try {
    const orders = await BigOrderItem.findAll({
      where: whereClause,
      attributes: [
        "id",
        "price",
        "returnQuantity",
        "orderStatus",
        "createdAt",
        "deliveredAt",
      ],
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: ["id", "customerId"],
          where: {
            customerId: userId,
          },
          required: true,
        },
        {
          model: Product,
          attributes: ["id", "productName"],
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["image", "contentType"],
            },
          ],
        },
      ],
    });

    return orders.map((item) => ({
      orderId: item.id,
      joinId: item.id,
      price: item.price,
      quantity: item.returnQuantity,
      orderDate: item.createdAt.toLocaleDateString(),
      deliverDate: item.deliveredAt?.toLocaleDateString(),
      orderStatus: item.orderStatus,
      productName: item.product.productName,
      image: `data:${
        item.product.images[0].contentType
      };base64,${item.product.images[0].image.toString("base64")}`,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getCustomerOrdersHistory = async (userId, months) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const whereClause = {};

  if (!isNaN(months)) {
    whereClause.createdAt = {
      [Op.gte]: startDate,
    };
  }

  try {
    const orders = await OrderProduct.findAll({
      where: {
        status: {
          [Op.in]: ["processing", "return+processing"],
        },
      },

      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: {
            orderStatus: "completed",
          },
          include: [
            {
              model: Order,
              as: "order",
              where: {
                customerId: userId,
              },
              required: true,
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["productName"],
          include: [
            {
              model: ProductImage,
              as: "images",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return orders.map((item) => ({
      joinId: [item.orderItemId, item.productId].join("_"),
      orderId: item.orderItemId,
      productId: item.productId,
      productName: item.product.productName,
      quantity: item.quantity,
      returnQuantity: item.returnQuantity,
      price: item.price,
      orderStatus: item.orderItem.orderStatus,
      orderDate: item.orderItem.order.createdAt.toLocaleDateString(),
      deliverDate: item.orderItem.deliveredAt?.toLocaleDateString() || null,
      image: `data:${
        item.product.images[0].contentType
      };base64,${item.product.images[0].image.toString("base64")}`,
    }));
  } catch (error) {
    throw error;
  }
};

exports.getStoresWithTotal = async ({ page, limit, searchTerm, companyId }) => {
  const offset = (page - 1) * limit;

  const where = {
    companyId,
    storeId: { [Op.ne]: null },
  };

  const havingClause = {};

  if (searchTerm) {
    havingClause["user.name"] = { [Op.like]: `%${searchTerm}%` };
  }

  // Step 1: Get paginated store totals
  const rows = await OrderItem.findAll({
    attributes: ["storeId", [fn("SUM", col("subTotal")), "totalAmount"]],
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
    ],
    group: ["storeId", "user.id", "user.name"],
    having: havingClause,
    order: [[fn("SUM", col("subTotal")), "DESC"]],
    offset,
    limit,
    raw: true,
    nest: true,
  });

  // Step 2: Count total groups manually for pagination
  const countResult = await OrderItem.findAll({
    attributes: ["storeId"],
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
    ],
    group: ["storeId", "user.id", "user.name"],
    having: havingClause,
    raw: true,
  });

  const totalRecords = countResult.length;

  const data = rows.map((item) => ({
    storeId: item.storeId,
    totalAmount: item.totalAmount,
    storeName: item.user.name,
  }));

  return {
    data,
    pagination: {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      page,
    },
  };
};

exports.getStoreOrders = async ({ page, limit, searchTerm, storeId }) => {
  const whereClause = {
    storeId,
  };
  if (searchTerm) {
    whereClause["$order.customer.name$"] = {
      [Op.like]: `%${searchTerm}%`,
    };
  }
  const offset = (page - 1) * limit;
  const { count, rows } = await OrderItem.findAndCountAll({
    attributes: ["id", "subTotal", "createdAt"],
    where: whereClause,
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "createdAt"],
        include: [
          {
            model: User,
            as: "customer",
          },
        ],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const data = rows.map((item) => ({
    customerName: item.order.customer.name,
    orderId: item.order.id,
    orderDate: new Date(item.order.createdAt).toLocaleDateString(),
    totalAmount: item.subTotal,
  }));

  return {
    data,
    pagination: {
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      page,
    },
  };
};

exports.getWarrantyProducts = async (orderId, userId) => {
  const orderProducts = await OrderProduct.findAll({
    attributes: ["id", "productId", "orderItemId", "warrantyDays", "quantity"],
    where: {
      orderItemId: orderId,
      isCancel: false,
      warrantyDays: {
        [Op.gt]: 0,
      },
    },
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "productName"],
      },
    ],
  });

  return orderProducts.map((item) => ({
    orderProductId: item.id,
    quantity: item.quantity,
    warranty: item.warranty / 365,
    productName: item.product.productName,
  }));
};

exports.getOrderProduct = async (orderItemId, productId) => {
  if (!orderItemId || !productId) {
    throw new Error("Please provide order ID");
  }
  const orderProduct = await OrderProduct.findOne({
    where: {
      orderItemId,
      productId,
    },
    attributes: [
      "id",
      "warrantyDays",
      "warrantyExpiresAt",
      "productId",
      "orderItemId",
    ],
    include: [
      {
        model: OrderItem,
        as: "orderItem",
        attributes: ["id", "deliveredAt", "createdAt", "orderId"],
      },
      {
        model: Product,
        as: "product",
        attributes: ["id", "productName"],
        include: [
          {
            model: ProductImage,
            as: "images",
          },
        ],
        required: true,
      },
    ],
  });

  const product = orderProduct?.product;

  if (!orderProduct || !product) {
    throw new Error("Order not found!");
  }

  return {
    showId: orderProduct.orderItem.orderId,
    productId: orderProduct.productId,
    orderItemId: orderProduct.orderItemId,
    productName: product.productName,
    productImage: `data:${
      product.images[0].contentType
    };base64,${product.images[0].image.toString("base64")}`,
    warranty: orderProduct.warrantyDays / 365,
    warrantyExpiry: new Date(
      orderProduct.warrantyExpiresAt
    ).toLocaleDateString(),
    purchaseDate: new Date(
      orderProduct.orderItem.createdAt
    ).toLocaleDateString(),
    deliverDate: new Date(
      orderProduct.orderItem.deliveredAt
    ).toLocaleDateString(),
  };
};
