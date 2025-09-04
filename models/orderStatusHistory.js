const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OrderStatusHistory extends Model {
    static associate(models) {
      OrderStatusHistory.belongsTo(models.OrderItem, {
        foreignKey: "orderItemId",
        as: "orderItem",
      });
    }
  }

  OrderStatusHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      orderItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
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
    },
    {
      sequelize,
      modelName: "OrderStatusHistory",
      tableName: "order_status_history",
      timestamps: true,
    }
  );

  return OrderStatusHistory;
};
