const { WarrantyList } = require("../models");
const logger = require("../utils/logger");

exports.addWarranty = async (req, res) => {
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
      .json({ success: false, message: "Invalid warranty name" });
  }

  try {
    const warranty = await WarrantyList.create({
      name,
      companyId: req.user.companyId,
    });
    res.json({ success: true, data: warranty });
  } catch (error) {
    logger.error("Error while adding warranty", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Failed to add warranty" });
  }
};

exports.getWarraties = async (req, res) => {
  try {
    const warraties = await WarrantyList.findAll({
      attributes: ["name"],
      where: { companyId: req.user.companyId },
    });
    res.json({ success: true, data: warraties });
  } catch (error) {
    logger.error("Error while getting warranties", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to get warraties" });
  }
};
