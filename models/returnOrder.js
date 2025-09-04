const { Model, DataTypes } = require("sequelize");


module.exports = (sequelize) => {
  class ReturnOrder extends Model {
    static associate(models) {
      ReturnOrder.belongsTo(models.OrderItem, {
        foreignKey: "orderItemId",
        as: "orderItem",
      });
      ReturnOrder.belongsTo(models.OrderProduct, {
        foreignKey: "orderProductId",
        as: "orderProduct",
      });
      ReturnOrder.hasMany(models.ReturnOrderStatusHistory, {
        foreignKey: "returnOrderId",
        as: "statusHistory",
      });
    }
  }

  ReturnOrder.init(
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
      returnQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "rejected",
          "pickUp",
          "received",
          "refunded",
          "completed"
        ),
        allowNull: false,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      pickUpDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pickUpTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      courierCompanyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      trackId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      courierAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      otherAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ReturnOrder",
      tableName: "return_orders",
      timestamps: true,
    }
  );

  return ReturnOrder;
};
