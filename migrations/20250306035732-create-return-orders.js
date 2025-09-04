"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("return_orders", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      orderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "order_items", // References the 'order_items' table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products", // References the 'products' table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      returnQuantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      orderStatus: {
        type: Sequelize.ENUM(
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
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      pickUpDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pickUpTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      courierCompanyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      trackId: {
        type: Sequelize.STRING,
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("return_orders");
  },
};
