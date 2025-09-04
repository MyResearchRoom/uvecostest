const { getAddressById } = require("../services/customerAddressService");
const orderService = require("../services/orderService");
const distributorService = require("../services/distributorService");
const storeService = require("../services/storeService");
const logger = require("../utils/logger");
const { validateQueryParams } = require("../utils/validateQueryParams");

exports.placeOrder = async (req, res) => {
  if (req.user.role === "customer") {
    this.placeCustomerOrder(req, res);
  } else {
    this.placeBigOrder(req, res);
  }
};

exports.placeCustomerOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const address = await getAddressById(orderData.deliveryAddressId);

    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid delivery address" });
    }

    const order = await orderService.placeOrder({
      ...orderData,
      customerId: req.user.id,
      address: address.toJSON(),
    });

    if (order) {
      logger.info(
        `Order #${order[0].orderId} placed successfully by user ${req.user.id}`
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    logger.error("Error while placing order", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message});
  }
};

exports.placeBigOrder = async (req, res) => {
  try {
    const orderData = req.body;
    let address = await getAddressById(orderData.deliveryAddressId);

    if (!address) {
      address =
        req.user.role === "distributor"
          ? await distributorService.getDistributorAddress(req.user.id)
          : await storeService.getStoreAddress(req.user.id);
    }

    delete address["id"];

    const priceRule =
      req.user.role === "distributor"
        ? await distributorService.getDistributorPriceRule(req.user.id)
        : await storeService.getStorePriceRule(req.user.id);

    if (
      req.user.role === "store" &&
      priceRule.storeType === "companyOwnStore"
    ) {
      return res.status(400).json({
        success: false,
        message: "Company Own Store cannot place order",
      });
    }

    const order = await orderService.placeBigOrder({
      ...orderData,
      customerId: req.user.id,
      address: address?.dataValues ? address.toJSON() : address,
      orderUser: req.user.role,
      priceRuleName: priceRule?.dataValues?.priceRule || "",
    });

    logger.info(
      `Order #${order[0].bigOrderId} placed successfully by user ${req.user.id}`
    );
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    logger.error("Error while placing order", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }

  try {
    const data = await orderService.getOrders(
      userId,
      role,
      parseInt(page),
      parseInt(limit),
      {
        date,
        status,
        searchTerm,
      }
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCancelOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }

  try {
    const data = await orderService.getCancelOrders(userId, role, page, limit, {
      date,
      status,
      searchTerm,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting cancel orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReturnOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }

  try {
    const data = await orderService.getReturnOrders(userId, role, page, limit, {
      date,
      status,
      searchTerm,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting return orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }
  let orderUser = "distributor";
  if (req.url.includes("store")) {
    orderUser = "store";
  }
  try {
    const data = await orderService.getBigOrders(
      orderUser,
      userId,
      role,
      parseInt(page),
      parseInt(limit),
      {
        date,
        status,
        searchTerm,
      }
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting big orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigCancelOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }
  let orderUser = "distributor";
  if (req.url === "/big/cancel/store/orders") {
    orderUser = "store";
  }
  try {
    const data = await orderService.getBigCancelOrders(
      orderUser,
      userId,
      role,
      parseInt(page),
      parseInt(limit),
      {
        date,
        status,
        searchTerm,
      }
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting big cancel orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigReturnOrders = async (req, res) => {
  const { page = 1, limit = 10, date, status, searchTerm } = req.query;
  let userId, role;
  if (req.user.role === "store") {
    userId = req.user.id;
    role = "store";
  } else {
    userId = req.user.companyId;
    role = "orderManager";
  }
  let orderUser = "distributor";
  if (req.url === "/big/return/store/orders") {
    orderUser = "store";
  }
  try {
    const data = await orderService.getBigReturnOrders(
      orderUser,
      userId,
      role,
      parseInt(page),
      parseInt(limit),
      {
        date,
        status,
        searchTerm,
      }
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while getting big return orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigOrderDetails = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.role === "store" ? req.user.id : req.user.companyId;
  const role = req.user.role;
  try {
    const order = await orderService.getBigOrderDetails(orderId, userId, role);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting big order details", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  const orderId = req.params.orderId;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;

  try {
    const order = await orderService.getOrderDetails(orderId, userId, role);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigProcessingOrderDetails = async (req, res) => {
  const joinId = req.params.joinId;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;
  let orderType = "processing";
  if (req.url.includes("cancel")) orderType = "cancelled";
  else if (req.url.includes("return")) orderType = "return";

  try {
    const order = await orderService.getBigProcessingOrderDetails(
      joinId,
      userId,
      role,
      orderType
    );
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting big processing order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDetails = async (req, res) => {
  if (req.user.role === "customer") {
    this.getProcessingOrderDetails(req, res);
  } else {
    this.getBigProcessingOrderDetails(req, res);
  }
};

exports.getProcessingOrderDetails = async (req, res) => {
  const joinId = req.params.joinId;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;

  try {
    const order = await orderService.getProcessingOrderDetails(
      ...joinId.split("_"),
      userId,
      role
    );
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting processing order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCancelOrderInDetails = async (req, res) => {
  if (req.user.role === "customer") {
    this.getCancelOrderDetails(req, res);
  } else {
    this.getBigProcessingOrderDetails(req, res);
  }
};

exports.getReturnOrderInDetails = async (req, res) => {
  if (req.user.role === "customer") {
    this.getReturnOrderDetails(req, res);
  } else {
    this.getBigProcessingOrderDetails(req, res);
  }
};

exports.getCancelOrderDetails = async (req, res) => {
  const joinId = req.params.joinId;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;

  try {
    const order = await orderService.getCancelOrderDetails(
      joinId,
      userId,
      role
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting cancel order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReturnOrderDetails = async (req, res) => {
  const joinId = req.params.joinId;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;

  try {
    const order = await orderService.getReturnOrderDetails(
      joinId,
      userId,
      role
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while getting return order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeStatus = async (req, res) => {
  if (req.user.role === "customer") {
    if (!req.body.productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }
    await this.changeOrderStatus(req, res);
  } else {
    await this.changeBigOrderStatus(req, res);
  }
};

exports.changeOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const {
    status,
    reason,
    shipDate,
    trackId,
    warrantyCode,
    note,
    courierCompanyId,
    returnQuantity,
    productId,
  } = req.body; // New status to update
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;
  const images = req.files?.["images[]"];

  if (
    (req.url.includes("return") || req.url.includes("cancel")) &&
    (role === "orderManager" || role === "store")
  ) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const updatedOrder = await orderService.changeOrderStatus({
      userId,
      role,
      orderId,
      newStatus: status,
      reason,
      shipDate,
      trackId,
      warrantyCode,
      note,
      courierCompanyId,
      returnQuantity,
      images,
      productId,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    logger.error("Error while updating order status", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeStatusOfCancelOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const { status, refundAmount, transactionId } = req.body;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;
  try {
    const updatedOrder = await orderService.changeStatusOfCancelOrder(
      orderId,
      userId,
      role,
      status,
      {
        refundAmount,
        transactionId,
      }
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    logger.error("Error while updating order status", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeStatusOfReturnOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const {
    status,
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
  } = req.body;
  const role = req.user.role;
  const userId = role === "orderManager" ? req.user.companyId : req.user.id;
  try {
    const updatedOrder = await orderService.changeStatusOfReturnOrder(
      orderId,
      userId,
      role,
      status,
      {
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
      }
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    logger.error("Error while updating return order status", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReturnImages = async (req, res, next) => {
  try {
    const returnImages = await orderService.getReturnImages(req.params.orderId);
    res.status(200).json({ success: true, data: returnImages });
  } catch (error) {
    logger.error("Error while getting return images", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateLabel = async (req, res) => {
  const orderId = req.params.orderId;
  const role = req.user.role;
  const userId = role === "store" ? req.user.id : req.user.companyId;

  try {
    const data = await orderService.generateLabel(orderId, userId, role);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while generating label", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changeBigOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const {
    status,
    reason,
    shipDate,
    trackId,
    warrantyCode,
    note,
    courierCompanyId,
    refundAmount,
    transactionId,
    returnQuantity,
    pickUpDate,
    pickUpTime,
    returnCourierCompanyId,
    returnTrackId,
    courierAmount,
    otherAmount,
    handlingAmount,
    comment,
  } = req.body; // New status to update
  const userId =
    req.user.role === "orderManager" ? req.user.companyId : req.user.id;
  const role = req.user.role;
  const images = req.files?.["images[]"];

  try {
    const updatedOrder = await orderService.changeBigOrderStatus({
      userId,
      role,
      orderId,
      newStatus: status,
      reason,
      shipDate,
      trackId,
      warrantyCode,
      note,
      courierCompanyId,
      refundAmount,
      transactionId,
      returnQuantity,
      images,
      pickUpDate,
      pickUpTime,
      returnCourierCompanyId,
      returnTrackId,
      courierAmount,
      otherAmount,
      handlingAmount,
      comment,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    logger.error("Error while changing big order status", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  if (req.user.role === "customer") {
    this.getCustomerOrdersWeb(req, res);
  } else {
    this.getBigCustomerOrdersWeb(req, res);
  }
};

exports.getCustomerOrdersWeb = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getCustomerOrders(userId, months);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting customer orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigCustomerOrdersWeb = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getBigCustomerOrders(userId, months);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting big customer orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderProducts = async (req, res) => {
  if (req.user.role === "customer") {
    this.getOrderProductsWeb(req, res);
  } else {
    this.getBigOrderProductsWeb(req, res);
  }
};

exports.getOrderProductsWeb = async (req, res) => {
  const { orderId } = req.params;
  try {
    const products = await orderService.getOrderProducts(orderId, req.user.id);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    logger.error("Error while getting order products", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigOrderProductsWeb = async (req, res) => {
  const { orderId } = req.params;
  try {
    const products = await orderService.getBigOrderProducts(
      orderId,
      req.user.id
    );
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    logger.error("Error while getting big order products", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelOrders = async (req, res) => {
  if (req.user.role === "customer") {
    this.getCustomerCancelOrders(req, res);
  } else {
    this.getBigCancelOrdersWeb(req, res);
  }
};

exports.getCustomerCancelOrders = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getCustomerCancelOrders(userId, months);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting customer cancel orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigCancelOrdersWeb = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getBigCustomerCancelOrders(
      userId,
      months
    );
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting big cancel orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.returnOrders = async (req, res) => {
  if (req.user.role === "customer") {
    this.getCustomerReturnOrders(req, res);
  } else {
    this.getBigReturnOrdersWeb(req, res);
  }
};

exports.getCustomerReturnOrders = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getCustomerReturnOrders(userId, months);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting customer return orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigReturnOrdersWeb = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getBigCustomerReturnOrders(
      userId,
      months
    );
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting big return orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerOrdersHistory = async (req, res) => {
  const userId = req.user.id;
  const months = req.query.months;
  try {
    const orders = await orderService.getCustomerOrdersHistory(userId, months);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("Error while getting customer orders history", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByCustomerId = async (req, res) => {
  const customerId = req.params.customerId;
  const { page, limit, searchTerm } = validateQueryParams({ ...req.query });

  try {
    const data = await orderService.getOrders(
      req.user.id,
      req.user.role,
      parseInt(page) !== "NaN" ? parseInt(page) : 1,
      parseInt(limit) !== "NaN" ? parseInt(limit) : 10,
      {
        date: req.query.date,
        status: req.query.status,
        searchTerm,
      },
      customerId
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCancelOrdersByCustomerId = async (req, res) => {
  const customerId = req.params.customerId;
  const { page, limit, searchTerm } = validateQueryParams({ ...req.query });

  try {
    const data = await orderService.getCancelOrders(
      req.user.id,
      req.user.role,
      page,
      limit,
      { date: req.query.date, status: req.query.status, searchTerm },
      customerId
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReturnOrdersByCustomerId = async (req, res) => {
  const customerId = req.params.customerId;
  const { page, limit, searchTerm } = validateQueryParams({ ...req.query });

  try {
    const data = await orderService.getReturnOrders(
      req.user.id,
      req.user.role,
      page,
      limit,
      { date: req.query.date, status: req.query.status, searchTerm },
      customerId
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStoresWithTotal = async (req, res) => {
  try {
    const { page, limit, searchTerm } = validateQueryParams({ ...req.query });
    const data = await orderService.getStoresWithTotal({
      page,
      limit,
      searchTerm,
      companyId: req.params.companyId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStoreOrders = async (req, res) => {
  try {
    const { page, limit, searchTerm } = validateQueryParams({ ...req.query });
    const data = await orderService.getStoreOrders({
      page,
      limit,
      searchTerm,
      storeId: req.params.storeId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWarrantyProducts = async (req, res) => {
  try {
    const data = await orderService.getWarrantyProducts(
      req.params.orderId,
      req.user.id
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderProduct = async (req, res) => {
  try {
    const joinId = req.params.joinId;
    const data = await orderService.getOrderProduct(...joinId.split("_"));
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
