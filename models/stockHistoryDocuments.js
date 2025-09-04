const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockHistoryDocument extends Model {
    static associate(models) {
      // Association with Distributor
      StockHistoryDocument.belongsTo(models.StockHistory, {
        foreignKey: "stockHistoryId",
        as: "stockHistory",
      });
    }
  }

  StockHistoryDocument.init(
    {
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file: {
        type: DataTypes.BLOB("long"), // Store encrypted file buffer
        allowNull: false,
      },
      contentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stockHistoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "StockHistoryDocument",
      tableName: "stock_history_documents",
      timestamps: false,
    }
  );

  return StockHistoryDocument;
};
