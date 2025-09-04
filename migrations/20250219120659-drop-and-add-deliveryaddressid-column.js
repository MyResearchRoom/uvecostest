"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("delivery_addresses", "orderId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "deliveryAddressId");
  },
};
