const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PlatformToCompanyTransaction extends Model {
    static associate(models) {
      PlatformToCompanyTransaction.belongsTo(models.Company, {
        as: "company",
        foreignKey: "companyId",
      });
    }
  }

  PlatformToCompanyTransaction.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transaction: {
        type: DataTypes.ENUM("straight", "reverse"),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PlatformToCompanyTransaction",
      tableName: "platform_to_company_transactions",
    }
  );

  return PlatformToCompanyTransaction;
};
