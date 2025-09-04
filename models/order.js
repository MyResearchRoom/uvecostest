const { Model, DataTypes } = require("sequelize");
const { generateRandomOrderId } = require("../utils/idGenerator");

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: "customerId",
        as: "customer",
      });
      Order.hasMany(models.OrderItem, {
        foreignKey: "orderId",
        as: "items",
      });
    }
  }

  Order.init(
    {
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
    }
  );

  Order.beforeCreate(async (order, options) => {
    let newOrderId;
    let exists = true;

    // Ensure uniqueness
    while (exists) {
      newOrderId = generateRandomOrderId();
      const found = await Order.findOne({ where: { id: newOrderId } });
      if (!found) exists = false;
    }

    order.id = newOrderId;
  });

  return Order;
};
