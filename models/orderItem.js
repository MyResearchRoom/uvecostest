const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
      OrderItem.hasMany(models.OrderProduct, {
        foreignKey: "orderItemId",
        as: "products",
      });
      OrderItem.belongsTo(models.Store, {
        foreignKey: "storeId",
        as: "store",
      });
      OrderItem.belongsTo(models.User, {
        foreignKey: "storeId",
        as: "user",
      });
      OrderItem.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      OrderItem.belongsTo(models.DeliveryAddress, {
        foreignKey: "deliveryAddressId",
        as: "deliveryAddress",
      });
      OrderItem.hasMany(models.OrderStatusHistory, {
        foreignKey: "orderItemId",
        as: "orderStatusHistory",
      });
    }
  }

  OrderItem.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderStatus: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "refunded",
          "pickUp",
          "readyToDispatch",
          "inTransit",
          "completed",
          "cancelled",
          "rejected",
          "return",
          "received"
        ),
        allowNull: false,
      },
      subTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      deliveryAddressId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      shipDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      trackId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      warrantyCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      courierCompanyId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      timestamps: true,
    }
  );

  return OrderItem;
};
