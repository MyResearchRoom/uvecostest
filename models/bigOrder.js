const { Model, DataTypes } = require("sequelize");

const { generateRandomOrderId } = require("../utils/idGenerator");

module.exports = (sequelize) => {
  class BigOrder extends Model {
    static associate(models) {
      BigOrder.belongsTo(models.User, {
        foreignKey: "customerId",
        as: "customer",
      });
      BigOrder.belongsTo(models.DeliveryAddress, {
        foreignKey: "deliveryAddressId",
        as: "deliveryAddress",
      });
      BigOrder.hasMany(models.BigOrderItem, {
        foreignKey: "bigOrderId",
        as: "items",
      });
    }
  }

  BigOrder.init(
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
      deliveryAddressId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderUser: {
        type: DataTypes.ENUM("store", "distributor"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BigOrder",
      tableName: "big_orders",
      timestamps: true,
    }
  );

  BigOrder.beforeCreate(async (order, options) => {
    let newOrderId;
    let exists = true;

    // Ensure uniqueness
    while (exists) {
      newOrderId = generateRandomOrderId();
      const found = await BigOrder.findOne({ where: { id: newOrderId } });
      if (!found) exists = false;
    }

    order.id = newOrderId;
  });

  return BigOrder;
};
