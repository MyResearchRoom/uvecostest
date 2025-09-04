const offlineOrderService = require("../services/offlineOrderService");
const logger = require("../utils/logger");

exports.createOfflineOrder = async (req, res) => {
  try {
    const storeId = req.user.role === "store" ? req.user.id : null;
    const companyId = req.user.companyId;
    const orderData = req.body;
    const { paymentMode, transactionId } = orderData;

    if (
      paymentMode !== "cash" &&
      (transactionId === null ||
        transactionId === "" ||
        transactionId === undefined)
    ) {
      return res
        .status(400)
        .json({ message: "Transaction ID is required for non-cash payment" });
    }

    const result = await offlineOrderService.createOfflineOrder(
      orderData,
      storeId,
      companyId
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      orderId: result.orderId,
      message: "Order created successfully",
    });
  } catch (error) {
    logger.error("Error while adding offline order", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const data = await offlineOrderService.getOrders(req);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Error while fetching orders", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await offlineOrderService.getOrderDetails(
      req.params.orderId,
      req.user
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("Error while fetching order details", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.repayAmount = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rePayingAmount, paymentMode, transactionId } = req.body;

    if (
      paymentMode !== "cash" &&
      (transactionId === null ||
        transactionId === "" ||
        transactionId === undefined)
    ) {
      return res
        .status(400)
        .json({ message: "Transaction ID is required for non-cash payment" });
    }

    const result = await offlineOrderService.repayAmount(
      orderId,
      rePayingAmount,
      paymentMode,
      transactionId
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res
      .status(200)
      .json({ success: true, message: "Amount repaid successfully" });
  } catch (error) {
    logger.error("Error while repaying amount", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};
