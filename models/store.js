const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  class Store extends Model {
    static associate(models) {
      Store.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Store.init(
    {
      storeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      industryType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
      },
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
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postalCodes: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      businessLiscense: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      taxIdentificationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      panCard: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
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
      modelName: "Store",
      tableName: "stores",
      timestamps: true,
    }
  );

  return Store;
};

// name: {
//   type: DataTypes.STRING,
//   allowNull: false,
// },
// email: {
//   type: DataTypes.STRING,
//   allowNull: false,
//   unique: true,
//   validate: {
//     isEmail: true,
//   },
// },
// mobileNumber: {
//   type: DataTypes.STRING,
//   allowNull: false,
// },
// password: {
//   type: DataTypes.STRING,
//   allowNull: false,
// },
