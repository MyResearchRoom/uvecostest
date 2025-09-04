const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WarrantyList extends Model {
    static associate(models) {
      WarrantyList.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  WarrantyList.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "WarrantyList",
      tableName: "warranty_list",
      timestamps: false,
    }
  );

  return WarrantyList;
};
