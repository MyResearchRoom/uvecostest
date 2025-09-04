const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OfflineOrderItem extends Model {
    static associate(models) {
      OfflineOrderItem.belongsTo(models.OfflineOrder, {
        foreignKey: "orderId",
        as: "order",
      });
      OfflineOrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }

  OfflineOrderItem.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      subTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      warrantyCodes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      warrantyExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OfflineOrderItem",
      tableName: "offline_order_items",
      timestamps: false,
    }
  );

  return OfflineOrderItem;
};
