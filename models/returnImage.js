const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReturnImage extends Model {
    static associate(models) {
      ReturnImage.belongsTo(models.ReturnOrder, {
        foreignKey: "returnOrderId",
        as: "items",
      });
      ReturnImage.belongsTo(models.BigOrderItem, {
        foreignKey: "bigOrderItemId",
        as: "orderItems",
      });
    }
  }
  ReturnImage.init(
    {
      returnOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bigOrderItemId: {
        type: DataTypes.INTEGER,
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
      modelName: "ReturnImage",
      tableName: "return_images",
      timestamps: false,
    }
  );
  return ReturnImage;
};
