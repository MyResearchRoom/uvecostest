const stockHistoryService = require("../services/stockHistoryService");
const logger = require("../utils/logger");

exports.addStockHistory = async (req, res, next) => {
  try {
    const { stockHistory, zipFileName, zipFilePath } =
      await stockHistoryService.addStockHistory(
        req.user.id,
        req.user.companyId,
        req.user.role,
        {
          ...req.body,
          files: req.files,
        }
      );

    if (stockHistory) {
      logger.info(
        `${
          req.user.role === "store" ? "Store" : "Order manager"
        } added the stock for product has a ID: ${req.body.productId}`,
        {
          actionBy: req.user.id,
          productId: req.body.productId,
        }
      );
    }

    if (req.user.role === "companyUser") {
      res.download(zipFilePath, zipFileName, (err) => {
        if (err) {
          logger.error("Error sending QR ZIP file", {
            error: err.message,
            stack: err.stack,
          });
          return res
            .status(500)
            .json({ success: false, message: "Error sending file" });
        }
        // fs.unlink(zipFilePath, () => {});
      });
    } else {
      res.status(200).json({ success: true, data: stockHistory });
    }
  } catch (error) {
    logger.error("Error while adding stock", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.getStockHistoryProduct = async (req, res, next) => {
  try {
    const data = await stockHistoryService.getStockHistoryProduct(
      req.user.id,
      req.user.companyId,
      req.user.role,
      req.query.searchTerm,
      req.query.page || 1,
      req.query.limit || 10,
      req.query.stockStatus
    );
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    logger.error("Error while getting stock history product", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.getStockHistoryByProductId = async (req, res, next) => {
  try {
    const data = await stockHistoryService.getStockHistoryByProductId(
      req.user.id,
      req.user.companyId,
      req.user.role,
      req.params.productId,
      req.query.page || 1,
      req.query.limit || 10,
      req.query.searchTerm
    );
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    logger.error("Error while getting stock history", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.getStockHistoryDocument = async (req, res, next) => {
  try {
    const data = await stockHistoryService.getStockHistoryDocument(
      req.params.documentId
    );
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    logger.error("Error while getting stock history document", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

exports.getListOfPreviouslyAddedStock = async (req, res, next) => {
  try {
    const data = await stockHistoryService.getListOfPreviouslyAddedStock(
      req.user.id,
      req.params.productId,
      req.user.companyId,
      req.user.role
    );
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    logger.error("Error while getting list of previously added stock", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};
