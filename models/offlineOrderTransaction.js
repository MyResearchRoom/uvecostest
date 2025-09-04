const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OfflineOrderTransaction extends Model {
    static associate(models) {
      OfflineOrderTransaction.belongsTo(models.OfflineOrder, {
        foreignKey: "orderId",
        as: "order",
      });
    }
  }

  OfflineOrderTransaction.init(
    {
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paidAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMode: {
        type: DataTypes.ENUM(
          "online",
          "cash",
          "card",
          "cheque",
          "bankTransfer"
        ),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "OfflineOrderTransaction",
      tableName: "offline_order_transactions",
    }
  );

  return OfflineOrderTransaction;
};
