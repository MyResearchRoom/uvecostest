"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "warranty");
    await queryInterface.addColumn("products", "warranty", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
    await queryInterface.addColumn("order_products", "warrantyDays", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "warrantyExpiresAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("order_products", "warrantyCode", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("products", "warranty", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.removeColumn("order_products", "warrantyDays");
    await queryInterface.removeColumn("order_products", "warrantyExpiresAt");
    await queryInterface.removeColumn("order_products", "warrantyCode");
  },
};
