"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CancelOrderRequest extends Model {
    static associate(models) {
      CancelOrderRequest.belongsTo(models.Order, {
        foreignKey: "orderId",
        as: "order",
      });
    }
  }

  CancelOrderRequest.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "rejected",
          "initiated",
          "completed"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CancelOrderRequest",
      tableName: "cancel_order_requests",
      timestamps: true,
    }
  );

  return CancelOrderRequest;
};
