"use strict";

const { all } = require("../routes/orderRoutes");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_categories", "requestedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("product_categories", "approvedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("product_categories", "requestedAt");
    await queryInterface.removeColumn("product_categories", "approvedAt");
  },
};
