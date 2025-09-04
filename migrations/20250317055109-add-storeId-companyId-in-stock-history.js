"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stock_history", "storeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    });
    await queryInterface.addColumn("stock_history", "companyId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {},
};
