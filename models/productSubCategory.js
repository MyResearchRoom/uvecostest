const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductSubCategory extends Model {
    static associate(models) {
      ProductSubCategory.belongsTo(models.ProductCategory, {
        foreignKey: "productCategoryId",
        as: "productCategory",
      });
    }
  }

  ProductSubCategory.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProductSubCategory",
      tableName: "product_sub_categories",
      timestamps: false,
      paranoid: true,
    }
  );

  return ProductSubCategory;
};
