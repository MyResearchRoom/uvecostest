"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pin_codes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      pinCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // village: {
      //   type: Sequelize.STRING,
      //   allowNull: false,
      // },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pin_codes");
  },
};
