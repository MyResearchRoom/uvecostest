"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("suppliers", "pinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "street", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "baseAddress", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn("suppliers", "address");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("suppliers", "pinCode");
    await queryInterface.removeColumn("suppliers", "street");
    await queryInterface.removeColumn("suppliers", "baseAddress");
    await queryInterface.addColumn("suppliers", "address", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
