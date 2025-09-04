const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OfflineCustomer extends Model {
    static associate(models) {
      OfflineCustomer.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: "store",
      });
      OfflineCustomer.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  OfflineCustomer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mobileNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      district: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "OfflineCustomer",
      tableName: "offline_customers",
    }
  );

  return OfflineCustomer;
};
