const { Store, User } = require("../models");

exports.getStoreAddress = async (userId) => {
  try {
    const data = await Store.findOne({
      where: {
        userId: userId,
      },
      attributes: [
        "city",
        "state",
        "country",
        "street",
        "pinCode",
        "district",
        "baseAddress",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "mobileNumber"],
        },
      ],
    });

    if (!data) {
      throw new Error("Store not found");
    }

    return {
      ...data.toJSON(),
      ...data.user.toJSON(),
      user: null,
    };
  } catch (error) {
    throw error;
  }
};

exports.getStorePriceRule = async (userId) => {
  try {
    return await Store.findOne({
      where: {
        userId: userId,
      },
      attributes: ["id", "priceRule", "pinCode", "storeType"],
    });
  } catch (error) {
    throw error;
  }
};
