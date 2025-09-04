const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      // Define one-to-one association
      Product.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company", // Alias for related Companies
      });
      Product.hasMany(models.Pricerule, {
        foreignKey: "productId",
        as: "pricerules", // Alias for related Pricerules
      });
      Product.hasMany(models.ProductImage, {
        foreignKey: "productId",
        as: "images", // Alias for related ProductImages
      });
      Product.belongsTo(models.ProductCategory, {
        foreignKey: "productCategoryId",
        as: "category", // Alias for related ProductCategories
      });
      Product.belongsTo(models.ProductSubCategory, {
        foreignKey: "productSubCategoryId",
        as: "subCategory", // Alias for related ProductCategories
      });
      Product.hasMany(models.Section, {
        foreignKey: "productId",
        as: "sections", // Alias for related Sections
      });
      Product.hasMany(models.Cart, {
        foreignKey: "productId",
        as: "cart",
      });
      Product.hasMany(models.Wishlist, {
        foreignKey: "productId",
        as: "wishlist",
      });
      Product.hasMany(models.StockHistory, {
        foreignKey: "productId",
        as: "stockHistory",
      });
      Product.hasOne(models.StoreProductStock, {
        foreignKey: "productId",
        as: "stock",
      });
      Product.hasMany(models.Review, {
        foreignKey: "productId",
        as: "reviews",
      });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      productCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productSubCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      video: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
      },
      videoContentType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      brandName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      soldBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      returnOption: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      displayType: {
        type: DataTypes.ENUM("centralized", "private"),
        allowNull: false,
      },
      deliveryMode: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      warranty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stockLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      stockThresholdLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isBlock: {
        type: DataTypes.ENUM("drafted", "pending", "approved", "rejected"),
        defaultValue: "drafted",
      },
      block: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      productStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      otherCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      cod: {
        type: DataTypes.ENUM("yes", "no"),
        allowNull: true,
      },
      shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      shipping: {
        type: DataTypes.ENUM("free", "paid"),
        allowNull: true,
      },
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      height: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      weight: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      length: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      width: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: true,
      },
      stockUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      isTopDeal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "products",
      paranoid: true,
      timestamps: true,
    }
  );

  return Product;
};
