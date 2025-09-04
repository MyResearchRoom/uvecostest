const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CompanyToStore extends Model {
    static associate(models) {
      CompanyToStore.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      CompanyToStore.belongsTo(models.User, {
        foreignKey: "storeId",
        as: "store",
      });
    }
  }

  CompanyToStore.init(
    {
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storeId: {
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
      modelName: "CompanyToStore",
      tableName: "company_to_stores",
      timestamps: false,
    }
  );

  return CompanyToStore;
};
