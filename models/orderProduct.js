const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OrderProduct extends Model {
    static associate(models) {
      OrderProduct.belongsTo(models.OrderItem, {
        foreignKey: "orderItemId",
        as: "orderItem",
      });
      OrderProduct.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      OrderProduct.hasOne(models.Review, {
        foreignKey: "orderProductId",
        as: "productReview",
      });
      OrderProduct.hasOne(models.ReturnOrder, {
        foreignKey: "orderProductId",
        as: "returnOrder",
      });
    }
  }

  OrderProduct.init(
    {
      orderItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      returnQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      otherCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      isCancel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.ENUM(
          "processing",
          "cancelled",
          "return",
          "return+processing"
        ),
        allowNull: false,
      },
      returnDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      returnDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isSettled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      warrantyCode: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      warrantyDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      warrantyExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "order_products",
      modelName: "OrderProduct",
    }
  );

  return OrderProduct;
};
