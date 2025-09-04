"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("order_items", "orderStatus", {
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
    });
    await queryInterface.changeColumn("order_status_history", "status", {
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
    });
  },

  async down(queryInterface, Sequelize) {},
};
