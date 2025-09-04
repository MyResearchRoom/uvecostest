const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.OrderProduct, {
        foreignKey: "orderProductId",
        as: "orderProduct",
      });
      Review.belongsTo(models.BigOrderItem, {
        foreignKey: "bigOrderItemId",
        as: "bigOrderItem",
      });
      Review.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }
  Review.init(
    {
      orderProductId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bigOrderItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      review: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Review",
      tableName: "reviews",
      timestamps: true,
    }
  );

  return Review;
};
