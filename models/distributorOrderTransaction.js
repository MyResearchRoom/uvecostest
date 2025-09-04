"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DistributorOrderTransaction extends Model {
    static associate(models) {
      // Define associations here
      DistributorOrderTransaction.belongsTo(models.DistributorOrder, {
        foreignKey: "distributorOrderId",
        as: "order",
      });
    }
  }

  DistributorOrderTransaction.init(
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
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DistributorOrderTransaction",
      tableName: "distributor_order_transactions",
      timestamps: true,
    }
  );

  return DistributorOrderTransaction;
};
