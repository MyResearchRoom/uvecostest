// models/user.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Company extends Model {
    static associate(models) {
      // Define one-to-one association
      Company.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user", // Alias for related Companies
      });
      Company.hasMany(models.ExtraDocument, {
        foreignKey: "companyId",
        as: "extraDocuments",
      });
      Company.hasMany(models.Product, {
        foreignKey: "companyId",
        as: "Product",
      });
      Company.hasMany(models.ProductCategory, {
        foreignKey: "companyId",
        as: "productCategories",
      });
    }
  }

  Company.init(
    {
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyType: {
        type: DataTypes.STRING,
        allowNull: true, // Optional
      },
      businessRegistrationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      licenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      panNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gstNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cinNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateOfEstablishment: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Optional
      },
      industryType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      websiteUrl: {
        type: DataTypes.STRING,
        allowNull: true, // Optional
      },
      taxIdentificationNumber: {
        type: DataTypes.STRING,
        allowNull: true, // Optional
      },
      productsCategory: {
        type: DataTypes.STRING,
        allowNull: true, // Optional
      },

      // Contact Details
      primaryPinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      primaryState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      primaryDistrict: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryContactPersonName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryPinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secondaryDistrict: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Director Details
      ownerFullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerEmailId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerPinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerDistrict: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Director Details
      directorFullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      directorEmailId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      directorPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      directorAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dinNumber: {
        type: DataTypes.STRING,
        allowNull: true, // Optional
      },
      directorPinCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      directorState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      directorDistrict: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Bank Details (all fields optional)
      accountHolderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      branchName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ifscCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      upiId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      isBlock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      logo: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      contentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Company",
      tableName: "companies",
    }
  );

  return Company;
};
