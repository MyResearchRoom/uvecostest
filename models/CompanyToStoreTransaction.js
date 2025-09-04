const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CompanyToStoreTransaction extends Model {
    static associate(models) {
      CompanyToStoreTransaction.belongsTo(models.Company, {
        as: "company",
        foreignKey: "companyId",
      });
    }
  }

  CompanyToStoreTransaction.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storeId: {
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
      modelName: "CompanyToStoreTransaction",
      tableName: "company_to_store_transactions",
    }
  );

  return CompanyToStoreTransaction;
};
