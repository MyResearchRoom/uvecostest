"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("distributor_order_status_history", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      distributorOrderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "distributor_orders",
          key: "id",
        },
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "accepted",
          "readyToDispatch",
          "inTransit",
          "completed",
          "rejected",
          "cancelled"
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
    await queryInterface.dropTable("distributor_order_status_history");
  },
};
