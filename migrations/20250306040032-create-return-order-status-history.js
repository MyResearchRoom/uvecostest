"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("return_order_status_history", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      returnOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "return_orders", // References the 'return_orders' table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
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
    await queryInterface.dropTable("return_order_status_history");
  },
};
