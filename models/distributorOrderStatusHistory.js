"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DistributorOrderStatusHistory extends Model {
    static associate(models) {
      // Define associations here
      DistributorOrderStatusHistory.belongsTo(models.DistributorOrder, {
        foreignKey: "distributorOrderId",
        as: "order",
      });
    }
  }

  DistributorOrderStatusHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      distributorOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "readyToDispatch",
          "inTransit",
          "completed",
          "rejected",
          "cancelled"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DistributorOrderStatusHistory",
      tableName: "distributor_order_status_history",
      timestamps: true,
    }
  );

  return DistributorOrderStatusHistory;
};
