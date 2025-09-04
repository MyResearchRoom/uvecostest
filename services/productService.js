const { ProductImage } = require("../models");

exports.getOneProductImage = async (productId) => {
  try {
    const image = await ProductImage.findOne({ where: { productId } });
    return `data:${image.contentType};base64,${image.image.toString("base64")}`;
  } catch (error) {
    throw error;
  }
};
