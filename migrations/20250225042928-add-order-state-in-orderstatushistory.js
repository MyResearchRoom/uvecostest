"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_status_history", "orderState", {
      type: Sequelize.ENUM(
        "processing",
        "completed",
        "cancelled",
        "return",
        "processing+return"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_status_history", "orderState");
  },
};
