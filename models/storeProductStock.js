const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StoreProductStock extends Model {
    static associate(models) {
      StoreProductStock.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      StoreProductStock.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: "store",
      });
      StoreProductStock.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }
  
  StoreProductStock.init(
    {
      productId: {
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
      stockLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stockThresholdLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "StoreProductStock",
      tableName: "store_product_stocks",
      timestamps: true,
    }
  );

  return StoreProductStock;
};
