"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "storeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    });
    await queryInterface.addColumn("order_items", "companyId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    });
    await queryInterface.addColumn("order_items", "orderStatus", {
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
    await queryInterface.addColumn("order_items", "orderState", {
      type: Sequelize.ENUM("processing", "completed", "cancelled", "return"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "storeId");
    await queryInterface.removeColumn("order_items", "companyId");
    await queryInterface.removeColumn("order_items", "orderStatus");
    await queryInterface.removeColumn("order_items", "orderState");
  },
};
