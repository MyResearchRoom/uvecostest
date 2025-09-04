"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("distributors", "pinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("distributors", "street", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("distributors", "baseAddress", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn("distributors", "address");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("distributors", "pinCode");
    await queryInterface.removeColumn("distributors", "street");
    await queryInterface.removeColumn("distributors", "baseAddress");
    await queryInterface.addColumn("distributors", "address", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
