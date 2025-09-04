const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BigOrderStatusHistory extends Model {
    static associate(models) {
      BigOrderStatusHistory.belongsTo(models.BigOrderItem, {
        foreignKey: "bigOrderItemId",
        as: "orderItem",
      });
    }
  }

  BigOrderStatusHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      bigOrderItemId: {
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
      orderState: {
        type: DataTypes.ENUM(
          "processing",
          "completed",
          "cancelled",
          "return",
          "processing+return"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BigOrderStatusHistory",
      tableName: "big_order_status_history",
      timestamps: true,
    }
  );

  return BigOrderStatusHistory;
};
