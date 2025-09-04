const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Company, {
        foreignKey: "userId",
        as: "companies",
      });
      User.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      User.hasOne(models.Store, {
        foreignKey: "userId",
        as: "store",
      });
      User.hasOne(models.StoreProductStock, {
        foreignKey: "storeId",
        as: "stock",
      });
      User.hasOne(models.CustomerAddress, {
        foreignKey: "userId",
        as: "customerAddress",
      });
      User.hasMany(models.CustomerAddress, {
        foreignKey: "userId",
        as: "customerAddresses",
      });
      User.hasMany(models.WarrantyClaim, {
        foreignKey: "customerId",
        as: "warrantyClaims",
      });
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mobileNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isNumeric: true,
          len: [10, 15], // Adjust length based on requirements
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(
          "platformUser",
          "companyUser",
          "orderManager",
          "productManager",
          "warrantyManager",
          "distributor",
          "customer"
        ),
        allowNull: false,
      },
      addedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otpExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  return User;
};
