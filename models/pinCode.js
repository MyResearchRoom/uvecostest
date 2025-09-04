const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Pincode extends Model {}

  Pincode.init(
    {
      pinCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
        allowNull: true,
      },
    },

    {
      sequelize,
      modelName: "Pincode",
      tableName: "pin_codes",
      timestamps: false,
    }
  );

  return Pincode;
};
