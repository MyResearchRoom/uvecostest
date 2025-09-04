"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "returnRefundAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "courierAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "otherAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "handlingAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "comment", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "returnRefundAmount");
    await queryInterface.removeColumn("order_items", "courierAmount");
    await queryInterface.removeColumn("order_items", "otherAmount");
    await queryInterface.removeColumn("order_items", "handlingAmount");
    await queryInterface.removeColumn("order_items", "comment");
  },
};
