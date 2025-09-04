const { OrderProduct, BigOrderItem, Review } = require("../models");
const { getReviews } = require("../services/reviewService");
const logger = require("../utils/logger");

exports.reviewProduct = async (req, res) => {
  if (req.user.role === "customer") {
    this.reviewOrderProduct(req, res);
  } else {
    this.reviewBigOrderProduct(req, res);
  }
};

exports.reviewOrderProduct = async (req, res) => {
  const orderId = req.params.orderId;
  const { review, rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating" });
  }

  try {
    const existingReview = await Review.findOne({
      where: {
        orderProductId: orderId,
      },
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.review = review;
      await existingReview.save();
    } else {
      const orderProduct = await OrderProduct.findByPk(orderId);
      if (!orderProduct) {
        return res.status(404).json({ message: "Order product not found" });
      }

      await Review.create({
        orderProductId: orderId,
        productId: orderProduct.productId,
        review,
        rating,
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "Order product reviewed successfully" });
  } catch (error) {
    logger.error("Error while reviewing the product", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewBigOrderProduct = async (req, res) => {
  const orderId = req.params.orderId;
  const { review, rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating" });
  }
  try {
    const existingReview = await Review.findOne({
      where: {
        bigOrderItemId: orderId,
      },
    });
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.review = review;
      await existingReview.save();
    } else {
      const orderItem = await BigOrderItem.findByPk(orderId);
      if (!orderItem) {
        return res.status(404).json({ message: "Order product not found" });
      }
      await Review.create({
        bigOrderItemId: orderId,
        productId: orderItem.productId,
        review,
        rating,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Order product reviewed successfully" });
  } catch (error) {
    logger.error("Error while reviewing the product", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await getReviews(req.params.productId);
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    logger.error("Error while feching review's", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};
