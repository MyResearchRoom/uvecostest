const { Pincode } = require("../models");

exports.getPinCodeData = async (req, res, next) => {
  try {
    const data = await Pincode.findAll({
      where: {
        pinCode: req.params.pincode,
      },
    });

    if (!data.length) {
      return res
        .status(404)
        .json({ success: false, message: "Pincode not found" });
    }

    const state = data[0].state;
    const district = data[0].district;
    const cities = [...new Set(data.map((entry) => entry.city))];

    res.status(200).json({
      success: true,
      data: {
        pinCode: req.params.pincode,
        state,
        district,
        cities,
        country: "India",
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error getting pin code data" });
  }
};
