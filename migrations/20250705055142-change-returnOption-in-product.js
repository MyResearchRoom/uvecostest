"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "returnOption");
    await queryInterface.addColumn("products", "returnOption", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "returnOption");
    await queryInterface.addColumn("products", "returnOption", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
