const {
  getInvoice,
  getSingleInvoice,
  getBigSingleInvoice,
  getBigInvoice,
  getOfflineInvoice,
  getReturnSingleInvoice,
  getAfterBillGenerateInvoice,
} = require("../services/invoiceService");
const logger = require("../utils/logger");

exports.getInvoice = async (req, res) => {
  const role = req.user.role;
  const userId = role === "store" ? req.user.id : req.user.companyId;

  try {
    const invoice = await getInvoice(req.params.orderId, userId, role);
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSingleInvoice = async (req, res) => {
  try {
    let invoice = null;
    if (req.user.role === "customer") {
      invoice = await getSingleInvoice(req.params.orderId, req.user.id);
    } else {
      invoice = await getBigSingleInvoice(req.params.orderId, req.user.id);
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBigInvoice = async (req, res) => {
  const orderId = req.params.orderId;
  const role = req.user.role;
  const userId = role === "store" ? req.user.id : req.user.companyId;
  try {
    const invoice = await getBigInvoice(orderId, userId, role);
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfflineInvoice = async (req, res) => {
  try {
    const invoice = await getOfflineInvoice(
      req.params.orderId,
      req.user.id,
      req.user.companyId,
      req.user.role
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReturnSingleInvoice = async (req, res) => {
  try {
    const invoice = await getReturnSingleInvoice(
      req.params.orderId,
      req.user.id
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAfterBillGenerateInvoice = async (req, res) => {
  try {
    const invoice = await getAfterBillGenerateInvoice(
      req.params.orderId,
      req.user.id,
      req.user.companyId,
      req.user.role
    );
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    logger.error("Error while feching invoice", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};
