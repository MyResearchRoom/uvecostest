"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_products", "discount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "handlingCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "shippingCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "otherCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("big_order_items", "discount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("big_order_items", "handlingCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("big_order_items", "shippingCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("big_order_items", "otherCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_products", "discount");
    await queryInterface.removeColumn("order_products", "handlingCharges");
    await queryInterface.removeColumn("order_products", "shippingCharges");
    await queryInterface.removeColumn("order_products", "otherCharges");
    await queryInterface.removeColumn("big_order_items", "discount");
    await queryInterface.removeColumn("big_order_items", "handlingCharges");
    await queryInterface.removeColumn("big_order_items", "shippingCharges");
    await queryInterface.removeColumn("big_order_items", "otherCharges");
  },
};
