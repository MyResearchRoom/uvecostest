const wishlistService = require("../services/wishlistService");
const logger = require("../utils/logger");

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;
    let move = false;
    if (req.url === "/move/wishlist") move = true;

    const wishlistItem = await wishlistService.addToWishlist(
      userId,
      productId,
      move
    );
    return res.status(201).json({
      success: true,
      message: "Item added to wishlist",
      data: wishlistItem,
    });
  } catch (error) {
    logger.error("Error while adding product to wishlist", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const result = await wishlistService.removeFromWishlist(userId, productId);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Item removed from wishlist",
    });
  } catch (error) {
    logger.error("Error while removing product from wishlist", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get wishlist items
exports.getWishlistItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistItems = await wishlistService.getWishlistItems(userId);
    return res.status(200).json({ success: true, data: wishlistItems });
  } catch (error) {
    logger.error("Error while getting wishlisted products", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ success: false, message: error.message });
  }
};
