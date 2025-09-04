const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ReturnOrderStatusHistory extends Model {
    static associate(models) {
      ReturnOrderStatusHistory.belongsTo(models.ReturnOrder, {
        foreignKey: "returnOrderId",
        as: "returnOrder",
      });
    }
  }

  ReturnOrderStatusHistory.init(
    {
      returnOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "accepted",
          "rejected",
          "pickUp",
          "received",
          "refunded",
          "completed"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ReturnOrderStatusHistory",
      tableName: "return_order_status_history",
      timestamps: true,
    }
  );

  return ReturnOrderStatusHistory;
};
