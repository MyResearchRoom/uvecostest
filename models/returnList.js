const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReturnList extends Model {
    static associate(models) {
      ReturnList.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  ReturnList.init(
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
      modelName: "ReturnList",
      tableName: "return_list",
      timestamps: false,
    }
  );

  return ReturnList;
};
