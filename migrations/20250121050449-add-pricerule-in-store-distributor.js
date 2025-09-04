"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("distributors", "priceRule", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("stores", "priceRule", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("distributors", "priceRule");
    await queryInterface.removeColumn("stores", "priceRule");
  },
};
