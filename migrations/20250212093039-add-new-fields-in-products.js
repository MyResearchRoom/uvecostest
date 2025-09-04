"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "brandName", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("products", "soldBy", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("products", "returnOption", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("products", "displayType", {
      type: Sequelize.ENUM("centralized", "private"),
      allowNull: false,
    });
    await queryInterface.addColumn("products", "deliveryMode", {
      type: Sequelize.JSON,
      allowNull: false,
    });
    await queryInterface.addColumn("products", "keywords", {
      type: Sequelize.JSON,
      allowNull: false,
    });
    await queryInterface.addColumn("products", "shippingCost", {
      type: Sequelize.ENUM("free", "paid"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "brandName");
    await queryInterface.removeColumn("products", "soldBy");
    await queryInterface.removeColumn("products", "returnOption");
    await queryInterface.removeColumn("products", "displayType");
    await queryInterface.removeColumn("products", "deliveryMode");
    await queryInterface.removeColumn("products", "keywords");
    await queryInterface.removeColumn("products", "shippingCost");
  },
};
