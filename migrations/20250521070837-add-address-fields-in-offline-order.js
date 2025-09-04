"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("offline_customers", "pinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("offline_customers", "district", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("offline_customers", "state", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("offline_customers", "city", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("offline_customers", "pinCode");
    await queryInterface.removeColumn("offline_customers", "district");
    await queryInterface.removeColumn("offline_customers", "state");
    await queryInterface.removeColumn("offline_customers", "city");
  },
};
