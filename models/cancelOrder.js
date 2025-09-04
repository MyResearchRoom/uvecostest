const { Model, DataTypes } = require("sequelize");


module.exports = (sequelize) => {
  class CancelOrder extends Model {
    static associate(models) {
      CancelOrder.belongsTo(models.OrderItem, {
        foreignKey: "orderItemId",
        as: "orderItem",
      });
      CancelOrder.belongsTo(models.OrderProduct, {
        foreignKey: "orderProductId",
        as: "orderProduct",
      });
      CancelOrder.hasMany(models.CancelOrderStatusHistory, {
        foreignKey: "cancelOrderId",
        as: "statusHistory",
      });
    }
  }

  CancelOrder.init(
    {
      orderItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderProductId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "rejected",
          "refunded",
          "completed"
        ),
        allowNull: false,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CancelOrder",
      tableName: "cancel_orders",
      timestamps: true,
    }
  );


  return CancelOrder;
};
