const { sequelize } = require("../models");
const cartService = require("../services/cartService");
const logger = require("../utils/logger");

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await cartService.addToCart(
      userId,
      productId,
      !isNaN(quantity) ? quantity : 1
    );
    return res
      .status(201)
      .json({ success: true, message: "Item added to cart", data: cartItem });
  } catch (error) {
    logger.error("Error while adding product to cart", {
          error: error.message,
          stack: error.stack,
        });
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Increment quantity
exports.incrementQuantity = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cartItem = await cartService.incrementQuantity(userId, productId);
    return res
      .status(200)
      .json({ success: true, message: "Quantity increased", data: cartItem });
  } catch (error) {
    logger.error("Error while incrementing cart product quantity", {
          error: error.message,
          stack: error.stack,
        });
    return res.status(400).json({ success: false, error: error.message });
  }
};

// Decrement quantity
exports.decrementQuantity = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const cartItem = await cartService.decrementQuantity(userId, productId);
    return res.status(200).json({
      message: cartItem ? "Quantity decreased" : "Item removed from cart",
      cartItem,
    });
  } catch (error) {
    logger.error("Error while decrementing cart product quantity", {
          error: error.message,
          stack: error.stack,
        });
    return res.status(400).json({ error: error.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    const result = await cartService.removeFromCart(userId, productId);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error while removing product from cart", {
          error: error.message,
          stack: error.stack,
        });
    return res.status(400).json({ error: error.message });
  }
};

// Get cart items
exports.getCartItems = async (req, res) => {
  try {
    const cartItems = await cartService.getCartItems(
      req.user.id,
      req.user.role
    );
    return res.status(200).json({ cartItems });
  } catch (error) {
    logger.error("Error while fetching cart products", {
          error: error.message,
          stack: error.stack,
        });
    return res.status(500).json({ error: error.message });
  }
};
