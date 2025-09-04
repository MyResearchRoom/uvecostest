"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("big_order_items", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      bigOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "big_orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
      storeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "companies",
          key: "id",
        },
      },
      orderStatus: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM(
          "processing",
          "completed",
          "cancelled",
          "return",
          "processing+return"
        ),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      gst: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subTotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      shipDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      trackId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      warrantyCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      note: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      courierCompanyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      transactionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      refundAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      returnTrackId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      returnCourierCompanyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      returnQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      pickUpDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pickUpTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      returnStatus: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      courierAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      otherAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      handlingAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("big_order_items");
  },
};
