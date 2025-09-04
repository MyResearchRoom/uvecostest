"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "pinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("stores", "street", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("stores", "baseAddress", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn("stores", "businessAddress");
    await queryInterface.removeColumn("stores", "location");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stores", "pinCode");
    await queryInterface.removeColumn("stores", "street");
    await queryInterface.removeColumn("stores", "baseAddress");
    await queryInterface.addColumn("stores", "businessAddress", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("stores", "location", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
