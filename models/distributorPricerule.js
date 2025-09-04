const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Distributorpricerule extends Model {
    static associate(models) {
      Distributorpricerule.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      }),
        Distributorpricerule.belongsTo(models.Distributor, {
          foreignKey: "distributorId",
          as: "distributor",
        });
    }
  }

  Distributorpricerule.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      distributorId: {
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
      modelName: "Distributorpricerule",
      tableName: "distributor_price_rules",
      timestamps: true,
    }
  );

  return Distributorpricerule;
};
