const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BigOrderItem extends Model {
    static associate(models) {
      BigOrderItem.belongsTo(models.BigOrder, {
        foreignKey: "bigOrderId",
        as: "order",
      });
      BigOrderItem.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      BigOrderItem.belongsTo(models.Store, {
        //  ========================= Look here
        foreignKey: "storeId",
        as: "store",
      });
      BigOrderItem.belongsTo(models.User, {
        //  ========================= Look here
        foreignKey: "storeId",
        as: "user",
      });
      BigOrderItem.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
      BigOrderItem.hasMany(models.BigOrderStatusHistory, {
        foreignKey: "bigOrderItemId",
        as: "orderStatusHistory",
      });
      BigOrderItem.hasOne(models.Review, {
        foreignKey: "bigOrderItemId",
        as: "productReview",
      });
    }
  }

  BigOrderItem.init(
    {
      bigOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
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
      mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gst: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      shippingCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      otherCharges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      remainingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      returnTrackId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      returnCourierCompanyId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      returnQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pickUpDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pickUpTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      returnStatus: {
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
        allowNull: true,
      },
      returnRefundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      courierAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      otherAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "BigOrderItem",
      tableName: "big_order_items",
      timestamps: true,
    }
  );

  return BigOrderItem;
};
