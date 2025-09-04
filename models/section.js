"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Section extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Section belongs to Product
      Section.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      Section.hasMany(models.Table, {
        foreignKey: "sectionId",
        as: "specifications",
      });
    }
  }

  Section.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sectionTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Section",
      tableName: "sections",
      timestamps: false, // No createdAt and updatedAt fields
    }
  );

  return Section;
};
