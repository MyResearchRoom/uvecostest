const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductCategory extends Model {
    static associate(models) {
      ProductCategory.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      ProductCategory.belongsTo(models.MainCategory, {
        foreignKey: "mainCategoryId",
        as: "mainCategory",
      });
    }
  }

  ProductCategory.init(
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
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mainCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      rejectStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      rejectNote: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProductCategory",
      tableName: "product_categories",
      timestamps: false,
      paranoid: true,
    }
  );

  return ProductCategory;
};
