const { Model, DataTypes } = require("sequelize");

class StockHistory extends Model {
  static associate(models) {
    StockHistory.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
    StockHistory.belongsTo(models.Supplier, {
      foreignKey: "supplierId",
      as: "supplier",
    });
    StockHistory.hasMany(models.StockHistoryDocument, {
      foreignKey: "stockHistoryId",
      as: "documents",
    });
  }
}

module.exports = (sequelize) => {
  StockHistory.init(
    {
      orderType: {
        type: DataTypes.ENUM("import", "export"),
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      restockDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      restockQuantity: {
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
      handlingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      transportCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "StockHistory",
      tableName: "stock_history",
      timestamps: true,
    }
  );

  return StockHistory;
};
