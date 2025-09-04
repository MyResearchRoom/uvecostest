"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "district", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "city", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "district", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "state", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("suppliers", "country", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("stores", "district");
    await queryInterface.removeColumn("suppliers", "city");
    await queryInterface.removeColumn("suppliers", "district");
    await queryInterface.removeColumn("suppliers", "state");
    await queryInterface.removeColumn("suppliers", "country");
  },
};
