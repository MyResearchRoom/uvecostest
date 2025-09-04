"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Table extends Model {
    static associate(models) {
      Table.belongsTo(models.Section, {
        foreignKey: "sectionId",
        as: "section",
      });
    }
  }

  Table.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      informationTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      information: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Table",
      tableName: "tables",
      timestamps: false,
    }
  );

  return Table;
};
