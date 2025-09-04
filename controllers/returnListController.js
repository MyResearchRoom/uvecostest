const { ReturnList } = require("../models");
const logger = require("../utils/logger");

exports.addReturn = async (req, res) => {
  const name = req.body.name;
  if (
    !name ||
    name === undefined ||
    name === "" ||
    name.length < 3 ||
    name.length > 20
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid return name" });
  }

  try {
    const newReturn = await ReturnList.create({
      name,
      companyId: req.user.companyId,
    });
    res.json({
      success: true,
      message: "Return added successfully",
      data: newReturn,
    });
  } catch (error) {
    logger.error("Error while adding return option", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to add return" });
  }
};

exports.getReturns = async (req, res) => {
  try {
    const returns = await ReturnList.findAll({
      atttributes: ["name"],
      where: { companyId: req.user.companyId },
    });
    res.json({ success: true, data: returns });
  } catch (error) {
    logger.error("Error while getting returns", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch returns" });
  }
};
