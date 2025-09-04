const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Wishlist extends Model {
    static associate(models) {
      Wishlist.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Wishlist.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  Wishlist.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Wishlist",
      tableName: "wishlists",
      timestamps: true,
    }
  );

  return Wishlist;
};
