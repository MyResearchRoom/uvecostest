"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_history", "gst", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
    await queryInterface.addColumn("stock_history", "transportCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
    await queryInterface.addColumn("stock_history", "handlingCharges", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stock_history", "gst");
    await queryInterface.removeColumn("stock_history", "transportCharges");
    await queryInterface.removeColumn("stock_history", "handlingCharges");
  },
};
