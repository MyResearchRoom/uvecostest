const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PlatformToCompany extends Model {
    static associate(models) {
    PlatformToCompany.belongsTo(models.Company, {
      foreignKey: "companyId",
      as: "company",
    });
  }
  }

  PlatformToCompany.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
    },
    {
      sequelize,
      modelName: "PlatformToCompany",
      tableName: "platform_to_companies",
      timestamps: false,
    }
  );

  return PlatformToCompany;
};
