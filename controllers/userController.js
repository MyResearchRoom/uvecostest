const { getCustomers } = require("../services/userService");
const logger = require("../utils/logger");
const { validateQueryParams } = require("../utils/validateQueryParams");

exports.getCustomers = async (req, res, next) => {
  const { searchTerm, page, limit } = validateQueryParams({ ...req.query });
  try {
    const customers = await getCustomers({
      searchTerm,
      limit,
      page,
      filter: {
        city: req.query.city,
      },
    });

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    logger.error("Error while processing get customers", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get customers" });
  }
};
