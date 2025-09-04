// models/user.js
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class UnveriefiedUser extends Model {}

  UnveriefiedUser.init(
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
          "distributor",
          "customer"
        ),
        allowNull: false,
      },
      addedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      componyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UnveriefiedUser",
      tableName: "unverified_users",
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  return UnveriefiedUser;
};
