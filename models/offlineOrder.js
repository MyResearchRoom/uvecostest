const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OfflineOrder extends Model {
    static associate(models) {
      OfflineOrder.belongsTo(models.OfflineCustomer, {
        foreignKey: "customerId",
        as: "customer",
      });
      OfflineOrder.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: "store",
      });
      OfflineOrder.belongsTo(models.User, {
        foreignKey: "storeId",
        as: "user",
      });
      OfflineOrder.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      OfflineOrder.hasMany(models.OfflineOrderItem, {
        foreignKey: "orderId",
        as: "items",
      });
      OfflineOrder.hasMany(models.OfflineOrderTransaction, {
        foreignKey: "orderId",
        as: "transactions",
      });
    }
  }
  OfflineOrder.init(
    {
      customerId: {
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
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "OfflineOrder",
      tableName: "offline_orders",
    }
  );

  return OfflineOrder;
};
