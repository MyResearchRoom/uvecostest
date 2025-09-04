const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductUnit extends Model {
    static associate(models) {
      ProductUnit.belongsTo(models.Batch, {
        foreignKey: "batchId",
        as: "batch",
      });
    }
  }

  ProductUnit.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      unitCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      batchId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      qrCodeData: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      isActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      activatedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: "ProductUnit",
      tableName: "product_units",
      timestamps: true,
    }
  );

  return ProductUnit;
};
