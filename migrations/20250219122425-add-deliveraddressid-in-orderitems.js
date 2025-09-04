"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "deliveryAddressId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "delivery_addresses",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "deliveryAddressId");
  },
};
