const { Model } = require("sequelize");
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class MainCategory extends Model {
    static associate(models) {
      MainCategory.hasMany(models.ProductCategory, {
        foreignKey: "mainCategoryId",
        as: "productCategories",
      });
    }
  }

  MainCategory.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
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
      modelName: "MainCategory",
      tableName: "main_categories",
      timestamps: false,
    }
  );

  return MainCategory;
};
