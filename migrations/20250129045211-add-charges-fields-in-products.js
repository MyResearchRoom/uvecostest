"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "handlingCharges", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("products", "otherCharges", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("products", "shipping", {
      type: Sequelize.ENUM("include", "exclude"),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "shippingCharges", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "handlingCharges");
    await queryInterface.removeColumn("products", "otherCharges");
    await queryInterface.removeColumn("products", "shipping");
    await queryInterface.removeColumn("products", " shippingCharges");
  },
};
