const { Op, fn, col } = require("sequelize");
const {
  Review,
  OrderProduct,
  OrderItem,
  Order,
  User,
  BigOrderItem,
  BigOrder,
} = require("../models");

exports.getReviews = async (productId) => {
  try {
    const reviews = await Review.findAll({
      attributes: ["rating", "review", "updatedAt"],
      where: {
        productId,
      },
      include: [
        {
          model: OrderProduct,
          as: "orderProduct",
          attributes: ["id"],
          include: [
            {
              model: OrderItem,
              as: "orderItem",
              attributes: ["id"],
              include: [
                {
                  model: Order,
                  as: "order",
                  attributes: ["id"],
                  include: [
                    {
                      model: User,
                      as: "customer",
                      attributes: ["id", "name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: BigOrderItem,
          as: "bigOrderItem",
          attributes: ["id"],
          include: [
            {
              model: BigOrder,
              as: "order",
              attributes: ["id"],
              include: [
                {
                  model: User,
                  as: "customer",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return reviews.map((item) => ({
      rating: item.rating,
      review: item.review,
      customerName: item.orderProduct
        ? item.orderProduct.orderItem.order.customer.name
        : item.bigOrderItem.order.customer.name,
      reviewDate: item.updatedAt.toLocaleDateString(),
    }));
  } catch (error) {
    throw error;
  }
};

exports.getReviewStats = async (productId) => {
  try {
    const result = await Review.findOne({
      attributes: [
        [fn("COUNT", col("Review.id")), "reviewCount"],
        [fn("AVG", col("Review.rating")), "averageRating"],
      ],
      where: {
        productId,
      },
      raw: true,
    });

    return {
      reviewCount: parseInt(result.reviewCount || 0, 10),
      averageRating: parseFloat(result.averageRating || 0),
    };
  } catch (error) {
    return {
      reviewCount: 0,
      averageRating: 0,
    };
  }
};
