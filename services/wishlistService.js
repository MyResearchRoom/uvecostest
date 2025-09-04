const { Wishlist, Product, Cart, sequelize } = require("../models");

// Add product to wishlist
exports.addToWishlist = async (userId, productId, move) => {
  const product = await Product.findByPk(productId);
  if (!product) throw new Error("Product not found");

  const transaction = await sequelize.transaction();
  try {
    if (move) {
      const cart = await Cart.destroy({
        where: { userId, productId },
        transaction,
      });
      if (!cart) throw new Error("Product not found in cart");
    }

    let wishlistItem = await Wishlist.findOne({
      where: { userId, productId },
      transaction,
    });

    if (wishlistItem) {
      throw new Error("Product already in wishlist");
    } else {
      wishlistItem = await Wishlist.create(
        { userId, productId },
        { transaction }
      );
    }

    await transaction.commit();

    return wishlistItem;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (userId, productId) => {
  const wishlistItem = await Wishlist.findOne({ where: { userId, productId } });
  if (!wishlistItem) throw new Error("Product not found in wishlist");

  await wishlistItem.destroy();
  return { message: "Item removed from wishlist" };
};

// Get wishlist items
exports.getWishlistItems = async (userId) => {
  return await Wishlist.findAll({
    where: { userId },
    attributes: [],
    include: [
      {
        model: Product,
        as: "product",
        attributes: [
          "id",
          "productName",
          "description",
          "originalPrice",
          "gst",
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

exports.isWishlisted = async (userId, productId) => {
  const wishlistItem = await Wishlist.findOne({ where: { userId, productId } });
  return wishlistItem ? true : false;
};

exports.getWishlistedProductIds = async (userId) => {
  const wishlistItems = await Wishlist.findAll({
    where: { userId },
    attributes: ["productId"],
  });
  return wishlistItems.map((item) => item.productId);
};
