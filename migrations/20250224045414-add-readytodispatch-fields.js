"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "shipDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "trackId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "warrantyCode", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "note", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "courierCompanyId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "shipDate");
    await queryInterface.removeColumn("order_items", "trackId");
    await queryInterface.removeColumn("order_items", "warrantyCode");
    await queryInterface.removeColumn("order_items", "note");
    await queryInterface.removeColumn("order_items", "courierCompanyId");
  },
};
