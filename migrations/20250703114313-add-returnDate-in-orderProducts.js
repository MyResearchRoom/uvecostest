"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_products", "returnDays", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "returnDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "isSettled", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_products", "returnDays");
    await queryInterface.removeColumn("order_products", "returnDate");
    await queryInterface.removeColumn("order_products", "isSettled");
  },
};
