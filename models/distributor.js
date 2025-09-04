// models/Distributor.js

const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  class Distributor extends Model {
    static associate(models) {
      Distributor.hasMany(models.DistributorBusinessDocument, {
        foreignKey: "distributorId",
        as: "documents",
      });
      Distributor.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Distributor.init(
    {
      // Personal Details
      pinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      street: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      baseAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      district: {
        type: DataTypes.STRING,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postalCodes: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Business Details
      region: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productsCategory: {
        type: DataTypes.STRING, // Single or comma-separated values
        allowNull: false,
      },
      taxIdentificationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      liscenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Bank Details
      bankName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ifscCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      branchName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      upiId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      qrCode: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      qrCodeContentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      priceRule: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Distributor",
      tableName: "distributors",
      timestamps: true,
    }
  );

  return Distributor;
};
