"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DistributorOrder extends Model {
    static associate(models) {
      // Define associations here
      DistributorOrder.belongsTo(models.User, {
        as: "distributor",
        foreignKey: "distributorId",
      });
      DistributorOrder.belongsTo(models.User, {
        as: "store",
        foreignKey: "storeId",
      });
      DistributorOrder.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      DistributorOrder.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  DistributorOrder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      distributorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      orderStatus: {
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
      modelName: "DistributorOrder",
      tableName: "distributor_orders",
      timestamps: true,
    }
  );

  return DistributorOrder;
};
