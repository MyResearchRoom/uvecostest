"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("big_order_status_history", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      bigOrderItemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "big_order_items", // Ensure this matches your table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("big_order_status_history");
  },
};
