const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CancelOrderStatusHistory extends Model {
    static associate(models) {
      CancelOrderStatusHistory.belongsTo(models.CancelOrder, {
        foreignKey: "cancelOrderId",
        as: "cancelOrder",
      });
    }
  }

  CancelOrderStatusHistory.init(
    {
      cancelOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "rejected",
          "refunded",
          "completed"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CancelOrderStatusHistory",
      tableName: "cancel_order_status_history",
      timestamps: true,
    }
  );

  return CancelOrderStatusHistory;
};
