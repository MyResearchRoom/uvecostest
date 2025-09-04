"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {
      Supplier.belongsTo(models.Company, {
        foreignKey: "companyId",
      });
    }
  }

  Supplier.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Name is required.",
          },
        },
      },
      mobileNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isNumeric: {
            msg: "Mobile number must contain only numbers.",
          },
          len: {
            args: [10, 15],
            msg: "Mobile number must be between 10 to 15 digits.",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: {
            msg: "Email must be valid.",
          },
        },
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
      category: {
        type: DataTypes.ENUM("local", "international"),
        allowNull: false,
        validate: {
          isIn: {
            args: [["local", "international"]],
            msg: "Category must be either 'local' or 'international'.",
          },
        },
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Supplier",
      tableName: "suppliers",
      timestamps: true,
    }
  );

  return Supplier;
};
