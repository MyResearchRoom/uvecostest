const { Op, where, col, Sequelize } = require("sequelize");
const {
  User,
  Distributor,
  Store,
  Company,
  Product,
  OrderItem,
  OrderProduct,
  Order,
  OfflineOrder,
  ReturnOrder,
  CancelOrder,
  Supplier,
  BigOrder,
  BigOrderItem,
  StoreProductStock,
} = require("../models");

//platform- total count overview -- final
exports.totalCountOverview = async (req, res) => {
  try {
    const distributorRevenue = await BigOrder.sum("totalAmount");
    const onlineRevenue = await OfflineOrder.sum("total");
    const instoreRevenue = await Order.sum("totalAmount");
    //Total Revenue
    const totalRevenue =
      (distributorRevenue || 0) + (onlineRevenue || 0) + (instoreRevenue || 0);
    //Total Companies count
    const totalCompanies = await Company.count();
    //Total Products count
    const totalProducts = await Product.count();
    //Total Customer count
    const totalCustomers = await User.count({
      where: {
        role: "customer",
      },
    });
    //Online Order Count
    const onlineOrder = await OrderItem.count();
    //Offline or Store Order Count
    const offlineOrder = await OfflineOrder.count();
    //Distributor Order Count
    const distributorOrder = await BigOrderItem.count();
    //Total Order Count
    const totalOrders = onlineOrder + offlineOrder + distributorOrder;

    const returnCount = await ReturnOrder.count();

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        breakdown: {
          distributorRevenue: distributorRevenue || 0,
          onlineRevenue: onlineRevenue || 0,
          instoreRevenue: instoreRevenue || 0,
        },
        totalCompanies,
        totalProducts,
        totalCustomers,
        onlineOrder,
        offlineOrder,
        distributorOrder,
        totalOrders,
        totalReturnOrders: returnCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get Total Revenue",
      message: error.message,
    });
  }
};

exports.liveCountOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = {};
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(endDate) };
    } else {
      // Default: Show today's data
      whereClause.createdAt = {
        [Op.gte]: today,
        [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Fetch Data
    const approvedProductsForSelectedDate = await Product.count({
      where: { isBlock: "approved", ...whereClause },
    });
    const totalCompaniesForSelectedDate = await Company.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      approvedProductsForSelectedDate,
      totalCompaniesForSelectedDate,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product and company counts",
      error: error.message,
    });
  }
};

//platform- filter by company overview -- final
exports.platformOverviewFilterByCompany = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json("Company Id is required");
    }

    const companyExists = await Company.findByPk(companyId);

    if (!companyExists) {
      return res
        .status(400)
        .json({ success: false, message: "Company not found" });
    }

    let whereCondition = { companyId };

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.createdAt = { [Op.lte]: new Date(endDate) };
    }

    //product count
    const productCount = await Product.count({ where: whereCondition });
    //stores count
    const storeCount = await Store.count({ where: whereCondition });
    //distributors count
    const distributorCount = await Distributor.count({ where: whereCondition });
    //supplier count
    const supplierCount = await Supplier.count({ where: whereCondition });

    //online order
    // const ownOnlineOrderCount = await OrderItem.count({
    //   where: whereCondition,
    // });

    // const ownStoreOnlineOrders = await OrderItem.count({
    //   where: { storeId: null, ...whereCondition },
    // });
    // const ownStoreOfflineOrders = await OfflineOrder.count({
    //   where: { storeId: null, ...whereCondition },
    // });
    // const ownStoreDistributorOrders = await BigOrderItem.count({
    //   where: { storeId: null, ...whereCondition },
    // });
    // const totalOwnStoreOrders =
    //   ownStoreOnlineOrders + ownStoreOfflineOrders + ownStoreDistributorOrders;

    const onlineOrders = await OrderItem.count({
      where: { storeId: null, ...whereCondition },
    });

    //own store orders/ in store orders
    const ownStoreOrders = await OfflineOrder.count({
      where: { storeId: null, ...whereCondition },
    });

    return res.status(200).json({
      success: true,
      data: {
        productCount,
        storeCount,
        distributorCount,
        supplierCount,
        // ownOnlineOrderCount,
        // ownStoreOnlineOrders,
        // ownStoreOfflineOrders,
        // ownStoreDistributorOrders,
        // totalOwnStoreOrders,
        onlineOrders,
        ownStoreOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//final
exports.companyTotalCountOverview = async (req, res) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company Id is required" });
    }

    console.log(companyId);

    const totalProducts = await Product.count({ where: { companyId } });
    const totalStores = await Store.count({ where: { companyId } });
    const totalSuppliers = await Supplier.count({ where: { companyId } });
    const totalDistributors = await Distributor.count({ where: { companyId } });
    // const totalCustomers = await User.count({ where: { companyId , role:"customer"} });

    // get customer count from OfflineOrders
    const offlineCustomerCount = await OfflineOrder.count({
      col: "customerId",
      distinct: true,
      where: { companyId },
    });

    // get customer count from Orders where related OrderItems have companyId
    const orderCustomerCount = await Order.count({
      col: "customerId",
      distinct: true,
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { companyId },
        },
      ],
    });

    // Total unique customers
    const totalCustomers = offlineCustomerCount + orderCustomerCount;

    // // Revenue
    const distributorRevenue = await BigOrder.sum("totalAmount", {
      include: [
        {
          model: BigOrderItem,
          as: "items",
          attributes: [],
          where: { companyId },
        },
      ],
    });
    const onlineRevenue = await OfflineOrder.sum("total", {
      where: { companyId },
    });
    // const instoreRevenue = await Order.sum("totalAmount", {
    //     include: [{
    //         model: OrderItem,
    //         as: "items",
    //         where: { companyId }
    //     }]
    // });
    const instoreRevenue = await Order.sum("totalAmount", {
      include: [
        {
          model: OrderItem,
          as: "items",
          attributes: [],
          where: { companyId },
        },
      ],
    });
    //Total Revenue Calculation
    const totalRevenue = distributorRevenue + onlineRevenue + instoreRevenue;

    // own store orders/ instore ordes/ offline orders
    const ownStoreOrders = await OfflineOrder.count({
      where: { companyId, storeId: { [Op.is]: null } },
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        ownStoreOrders,
        totalProducts,
        totalStores,
        totalSuppliers,
        totalDistributors,
        totalCustomers,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//final
exports.companyLiveCountOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    let whereClause = { companyId };
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(endDate) };
    } else {
      // Default: Show today's data
      whereClause.createdAt = {
        [Op.gte]: today,
        [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Fetch Data with companyId filtering
    const approvedProductsForSelectedDate = await Product.count({
      where: { isBlock: "approved", ...whereClause },
    });
    const rejectedProductsForSelectedDate = await Product.count({
      where: { isBlock: "rejected", ...whereClause },
    });
    const totalProductsForSelectedDate = await Product.count({
      where: whereClause,
    });
    const totalStoresForSelectedDate = await Store.count({
      where: whereClause,
    });
    const totalDistributorsForSelectedDate = await Distributor.count({
      where: whereClause,
    });
    const totalSupplierForSelectedDate = await Supplier.count({
      where: whereClause,
    });

    // own store orders/ instore ordes/ offline orders
    const ownStoreOrders = await OfflineOrder.count({
      where: { storeId: null, ...whereClause },
    });

    res.status(200).json({
      success: true,
      data: {
        approvedProductsForSelectedDate,
        rejectedProductsForSelectedDate,
        totalProductsForSelectedDate,
        totalStoresForSelectedDate,
        totalDistributorsForSelectedDate,
        totalSupplierForSelectedDate,
        ownStoreOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

//not using this api -- modifications remaining
exports.companyOverviewByStore = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const whereCondition = {};
    // Handle date filters
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.createdAt = { [Op.lte]: new Date(endDate) };
    }

    // If storeId is provided, filter for a specific store; otherwise, get "own store" orders
    if (storeId) {
      whereCondition.storeId = storeId;
    } else {
      whereCondition.storeId = { [Op.is]: null };
    }

    // Fetch order counts
    const [
      ownOnlineOrderCount,
      ownOfflineOrderCount,
      ownDistributorOrderCount,
    ] = await Promise.all([
      OrderItem.count({ where: whereCondition }),
      OfflineOrder.count({ where: whereCondition }),
      BigOrderItem.count({ where: whereCondition }),
    ]);

    // Total orders based on filtering condition
    const totalOrders =
      ownOnlineOrderCount + ownOfflineOrderCount + ownDistributorOrderCount;

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        ownOnlineOrderCount,
        ownOfflineOrderCount,
        ownDistributorOrderCount,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//final
//store total count overview -- payables, receviables, sales remaining
exports.storeTotalCountOverview = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  try {
    const store = await Store.findOne({ where: { userId } });

    if (!store || !store.id) {
      return res
        .status(404)
        .json({ success: false, error: "Store not found for this user" });
    }

    const storeId = store.id;

    // Sales count
    const orderItemsCount = await OrderItem.sum("subTotal", {
      where: { storeId: req.user.id },
    });
    const offlineOrdersCount = await OfflineOrder.sum("total", {
      where: { storeId: req.user.id },
    });
    const bigOrdersItemsCount = await BigOrderItem.sum("subTotal", {
      where: { storeId: req.user.id },
    });
    const totalSalesCount =
      orderItemsCount + offlineOrdersCount + bigOrdersItemsCount;
    const totalReceivables = await BigOrderItem.sum("subTotal", {
      where: { storeId: req.user.id },
    });

    //orders
    const onlineOrders = await OrderItem.count({ where: { storeId } });
    const offlineOrders = await OfflineOrder.count({ where: { storeId } });
    const bigOrders = await BigOrderItem.count({ where: { storeId } });
    const totalOrders = onlineOrders + offlineOrders + bigOrders;

    //customers
    const orderCustomerCount = await Order.count({
      col: "customerId",
      distinct: true,
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { storeId },
        },
      ],
    });

    const offlineCustomerCount = await OfflineOrder.count({
      col: "customerId",
      distinct: true,
      where: { storeId },
    });

    const bigOrdersCustomersCount = await BigOrder.count({
      col: "customerId",
      distinct: true,
      include: [
        {
          model: BigOrderItem,
          as: "items",
          where: { storeId },
        },
      ],
    });

    const totalCustomers =
      orderCustomerCount + offlineCustomerCount + bigOrdersCustomersCount;

    return res.status(200).json({
      success: true,
      storeId,
      totalSalesCount,
      totalReceivables,
      onlineOrders,
      offlineOrders,
      bigOrders,
      totalOrders,
      orderCustomerCount,
      offlineCustomerCount,
      bigOrdersCustomersCount,
      totalCustomers,
    });
  } catch (error) {
    console.error("Error fetching store total count:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//store live count overview -- final
exports.storeLiveCountOverview = async (req, res) => {
  const { startDate, endDate } = req.query;
  let whereClause = {};
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  } else if (startDate) {
    whereClause.createdAt = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    whereClause.createdAt = { [Op.lte]: new Date(endDate) };
  } else {
    // Default: Show today's data
    whereClause.createdAt = {
      [Op.gte]: today,
      [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    };
  }
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  try {
    const store = await Store.findOne({ where: { userId } });

    if (!store || !store.id) {
      return res
        .status(404)
        .json({ success: false, error: "Store not found for this user" });
    }

    const storeId = store.id;

    //out of stock
    const outOfStockCount = await StoreProductStock.count({
      where: { storeId, stockLevel: 0, ...whereClause },
    });
    //low stock
    const lowStockCount = await StoreProductStock.count({
      where: {
        storeId,
        stockLevel: {
          [Op.gt]: 0,
          [Op.lt]: Sequelize.col("stockThresholdLevel"),
        },
        ...whereClause,
      },
    });

    return res
      .status(200)
      .json({ success: true, storeId, outOfStockCount, lowStockCount });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

//own store overview -- prefer 2nd which is final
// exports.ownStoreOverview = async (req, res) => {
//   const { startDate, endDate } = req.query;
//   let whereClause = {};
//   let today = new Date();
//   today.setHours(0, 0, 0, 0);

//   if (startDate && endDate) {
//     whereClause.createdAt = {
//       [Op.between]: [new Date(startDate), new Date(endDate)],
//     };
//   } else if (startDate) {
//     whereClause.createdAt = { [Op.gte]: new Date(startDate) };
//   } else if (endDate) {
//     whereClause.createdAt = { [Op.lte]: new Date(endDate) };
//   } else {
//     // Default: Show today's data
//     whereClause.createdAt = {
//       [Op.gte]: today,
//       [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
//     };
//   }
//   const userId = req.user?.id;

//   if (!userId) {
//     return res
//       .status(400)
//       .json({ success: false, error: "User ID is required" });
//   }

//   try {
//     const store = await Store.findOne({ where: { userId } });

//     if (!store || !store.id) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Store not found for this user" });
//     }

//     const storeId = store.id;

//     console.log(storeId);

//     // Own Store Orders Count (Filtered by Company ID)
//     const ownOnlineOrderCount = await OrderItem.count({
//       where: { ...whereClause, storeId: { [Op.is]: null } },
//     });

//     const ownOfflineOrderCount = await OfflineOrder.count({
//       where: { ...whereClause, storeId: { [Op.is]: null } },
//     });

//     const ownDistributorOrderCount = await BigOrderItem.count({
//       where: { ...whereClause, storeId: { [Op.is]: null } },
//     });

//     // Total Own Store Orders Count
//     const totalOwnStoreOrders =
//       ownOnlineOrderCount + ownOfflineOrderCount + ownDistributorOrderCount;
//     return res.status(200).json({
//       success: true,
//       ownOnlineOrderCount,
//       ownOfflineOrderCount,
//       ownDistributorOrderCount,
//       totalOwnStoreOrders,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };
exports.ownStoreOverview = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  try {
    const store = await Store.findOne({ where: { userId } });

    if (!store || !store.id) {
      return res
        .status(404)
        .json({ success: false, error: "Store not found for this user" });
    }

    const storeId = store.id;

    //orders
    const onlineOrders = await OrderItem.count({ where: { storeId } });
    const offlineOrders = await OfflineOrder.count({ where: { storeId } });
    const bigOrders = await BigOrderItem.count({ where: { storeId } });
    const totalOrders = onlineOrders + offlineOrders + bigOrders;

    return res.status(200).json({
      success: true,
      storeId,
      onlineOrders,
      offlineOrders,
      bigOrders,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching store total count:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//order manager overview -- prefer 2nd which is final
// exports.orderManagerOverview = async (req, res) => {
//   try {
//     const { role, companyId, storeId } = req.user;

//     const whereClause = {
//       orderStatus: {
//         [Op.ne]: ["rejected", "return"]
//       }
//     }
//     if (req.user.role === 'orderManager') {
//       whereClause.companyId = req.user.companyId
//       whereClause.storeId = null
//     }
//     else {
//       whereClause.storeId = req.user.id
//     }

//     if (!companyId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Company Id is required" });
//     }

//     let orderItemWhere = {};

//     if (role === "order_manager") {
//       orderItemWhere.companyId = companyId;
//     } else if (role === "store_manager") {
//       if (!storeId) {
//         return res
//           .status(400)
//           .json({
//             success: false,
//             message: "Store Id is required for store manager",
//           });
//       }
//       orderItemWhere.storeId = storeId;
//     }

//     const onlineOrderCount = await OrderItem.count({
//       where: whereClause,
//     });

//     const offlineOrderCount = await OfflineOrder.count({
//       where: { companyId, storeId: { [Op.ne]: null }, },
//     });

//     const distributorOrderCount = await BigOrderItem.count({
//       where: { companyId, storeId: { [Op.ne]: null }, },
//     });

//     // Own Store Orders Count (Filtered by Company ID)
//     const ownOnlineOrderCount = await OrderItem.count({
//       where: { companyId, storeId: { [Op.ne]: null }, },
//     });

//     const ownOfflineOrderCount = await OfflineOrder.count({
//       where: { companyId, storeId: { [Op.is]: null } },
//     });

//     const ownDistributorOrderCount = await BigOrderItem.count({
//       where: { companyId, storeId: { [Op.is]: null } },
//     });

//     // Total Own Store Orders Count
//     const totalOwnStoreOrders =
//       ownOnlineOrderCount + ownOfflineOrderCount + ownDistributorOrderCount;

//     //cancel Orders count
//     const cancelOrderCount = await CancelOrder.count({
//       include: [
//         {
//           model: OrderItem,
//           as: "orderItem",
//           where: orderItemWhere,
//         },
//       ],
//     });

//     //return order
//     const returnOrderCount = await ReturnOrder.count({
//       include: [
//         {
//           model: OrderItem,
//           as: "orderItem",
//           where: orderItemWhere,
//         },
//       ],
//     });

//     return res.status(200).json({
//       success: true,
//       data: {
//         onlineOrderCount,
//         offlineOrderCount,
//         distributorOrderCount,
//         ownOnlineOrderCount,
//         ownOfflineOrderCount,
//         ownDistributorOrderCount,
//         totalOwnStoreOrders,
//         cancelOrderCount,
//         returnOrderCount,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
exports.orderManagerOverview = async (req, res) => {
  try {
    const { role, companyId, storeId } = req.user;

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company Id is required" });
    }

    let orderItemWhere = {};

    //online orders
    const whereClause = {};
    if (req.user.role === "orderManager") {
      whereClause.companyId = req.user.companyId;
      whereClause.storeId = null;
    } else {
      whereClause.storeId = req.user.id;
    }

    const onlineOrderCount = await OrderItem.count({
      where: whereClause,
      distinct: true,
      col: "orderId",
      include: [
        {
          model: OrderProduct,
          as: "products",
          attributes: [],
          where: {
            status: {
              [Op.in]: ["processing", "return+processing"],
            },
          },
          required: true,
        },
      ],
    });

    //offline/instore orders
    const offlineWhereClause = {};
    if (req.user.role === "orderManager") {
      offlineWhereClause.companyId = req.user.companyId;
      offlineWhereClause.storeId = null;
    } else {
      offlineWhereClause.companyId = req.user.companyId;
      offlineWhereClause.storeId = req.user.id;
    }

    const offlineOrderCount = await OfflineOrder.count({
      where: offlineWhereClause,
    });

    //big orders contains store orders and distributor orders
    const bigOrderWhereClause = {};
    if (req.user.role === "orderManager") {
      bigOrderWhereClause.companyId = req.user.companyId;
      bigOrderWhereClause.storeId = null;
    } else {
      bigOrderWhereClause.companyId = req.user.companyId;
      bigOrderWhereClause.storeId = req.user.id;
    }
    //distributor orders
    const distributorOrderCount = await BigOrderItem.count({
      where: bigOrderWhereClause,
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: [],
          where: {
            orderUser: "distributor",
          },
        },
      ],
    });

    //store orders
    const storeOrderCount = await BigOrderItem.count({
      where: bigOrderWhereClause,
      include: [
        {
          model: BigOrder,
          as: "order",
          attributes: [],
          where: {
            orderUser: "store",
          },
        },
      ],
    });

    // // Own Store Orders Count (Filtered by Company ID)
    // const ownOnlineOrderCount = await OrderItem.count({
    //   where: { companyId, storeId: { [Op.is]: null } },
    // });

    // const ownOfflineOrderCount = await OfflineOrder.count({
    //   where: { companyId, storeId: { [Op.is]: null } },
    // });

    // const ownDistributorOrderCount = await BigOrderItem.count({
    //   where: { companyId, storeId: { [Op.is]: null } },
    // });

    // // Total Own Store Orders Count
    // const totalOwnStoreOrders =
    //   ownOnlineOrderCount + ownOfflineOrderCount + ownDistributorOrderCount;

    //cancel Orders count
    const cancelOrderCount = await CancelOrder.count({
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: orderItemWhere,
        },
      ],
    });

    //return order
    const returnOrderCount = await ReturnOrder.count({
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: orderItemWhere,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: {
        onlineOrderCount,
        offlineOrderCount,
        distributorOrderCount,
        storeOrderCount,
        // ownOnlineOrderCount,
        // ownOfflineOrderCount,
        // ownDistributorOrderCount,
        // totalOwnStoreOrders,
        cancelOrderCount,
        returnOrderCount,
      },
    });
  } catch (error) {
    logger.error("Error while getting order manager overview", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//product manager overview -- final
exports.productManagerOverview = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "User ID is required" });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user || !user.companyId) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found for this user" });
    }

    const companyId = user.companyId;

    const totalProducts = await Product.count({ where: { companyId } });
    const approvedProducts = await Product.count({
      where: { isBlock: "approved", companyId: companyId },
    });
    const rejectedProducts = await Product.count({
      where: { isBlock: "rejected", companyId: companyId },
    });

    return res.status(200).json({
      success: true,
      totalProducts,
      approvedProducts,
      rejectedProducts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//store manager overview -- final
exports.storeManagerOverview = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "User Id is required" });
  }

  try {
    const store = await Store.findOne({ where: { userId } });

    if (!store || !store.id) {
      return res
        .status(404)
        .json({ success: false, error: "Store not found for this user" });
    }

    const storeId = store.id;

    // orders
    const onlineOrders = await OrderItem.count({ where: { storeId: userId } });
    const offlineOrders = await OfflineOrder.count({
      where: { storeId: userId },
    });
    const bigOrders = await BigOrderItem.count({
      where: { storeId: userId },
      include: [
        {
          model: BigOrder,
          as: "order",
          where: {
            orderUser: "distributor",
          },
        },
      ],
    });
    const totalOrders = onlineOrders + offlineOrders + bigOrders;

    //cancel and return orders count
    const cancelOrderCount = await OrderProduct.count({
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: {
            storeId,
          },
        },
      ],
      where: {
        status: "cancelled",
      },
    });

    const returnOrderCount = await OrderProduct.count({
      include: [
        {
          model: OrderItem,
          as: "orderItem",
          where: {
            storeId,
          },
        },
      ],
      where: {
        status: { [Op.in]: ["return", "return+processing"] },
      },
    });

    // Out of stock
    const outOfStockCount = await StoreProductStock.count({
      where: { storeId, stockLevel: 0 },
    });
    // Low stock
    const lowStockCount = await StoreProductStock.count({
      where: {
        storeId,
        stockLevel: {
          [Op.gt]: 0,
          [Op.lt]: Sequelize.col("stockThresholdLevel"),
        },
      },
    });
    // In stock
    const inStockCount = await StoreProductStock.count({
      where: {
        storeId,
        stockLevel: { [Op.gt]: Sequelize.col("stockThresholdLevel") },
      },
    });

    return res.status(200).json({
      success: true,
      onlineOrders,
      offlineOrders,
      bigOrders,
      totalOrders,
      cancelOrderCount,
      returnOrderCount,
      outOfStockCount,
      lowStockCount,
      inStockCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
