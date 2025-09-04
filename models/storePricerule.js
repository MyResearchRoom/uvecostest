const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Storepricerule extends Model {
    static associate(models) {
      Storepricerule.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      }),
        Storepricerule.belongsTo(models.Store, {
          foreignKey: "storeId",
          as: "store",
        });
    }
  }

  Storepricerule.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      storeId: {
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
      modelName: "Storepricerule",
      tableName: "store_price_rules",
      timestamps: true,
    }
  );

  return Storepricerule;
};
