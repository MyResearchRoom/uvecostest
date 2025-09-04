"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("stock_history", "orderType", {
      type: Sequelize.ENUM("import", "domestic"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {},
};
