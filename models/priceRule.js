const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Pricerule extends Model {
    static associate(models) {
      Pricerule.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      Pricerule.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  Pricerule.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      priceValue: {
        type: DataTypes.DECIMAL(10, 2),
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
    },
    {
      sequelize,
      modelName: "Pricerule",
      tableName: "price_rules",
      timestamps: true,
    }
  );

  return Pricerule;
};
