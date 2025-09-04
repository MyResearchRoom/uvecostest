"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cancel_orders", "productId");
    await queryInterface.removeColumn("return_orders", "productId");
    await queryInterface.addColumn("cancel_orders", "orderProductId", {
      type: Sequelize.INTEGER,
      references: {
        model: "order_products",
        key: "id",
      },
    });
    await queryInterface.addColumn("return_orders", "orderProductId", {
      type: Sequelize.INTEGER,
      references: {
        model: "order_products",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {},
};
