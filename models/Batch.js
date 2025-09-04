const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Batch extends Model {
    static associate(models) {
      Batch.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      Batch.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      Batch.hasMany(models.ProductUnit, {
        foreignKey: "batchId",
        as: "units",
      });
    }
  }

  Batch.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      batchNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      manufacturingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      warranty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Batch",
      tableName: "batches",
      timestamps: true,
    }
  );

  return Batch;
};
