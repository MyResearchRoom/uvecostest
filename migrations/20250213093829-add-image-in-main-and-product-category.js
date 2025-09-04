"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("main_categories", "image", {
      type: Sequelize.BLOB("long"),
      allowNull: false,
    });
    await queryInterface.addColumn("main_categories", "contentType", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("product_categories", "image", {
      type: Sequelize.BLOB("long"),
      allowNull: false,
    });
    await queryInterface.addColumn("product_categories", "contentType", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("main_categories", "image");
    await queryInterface.removeColumn("main_categories", "contentType");
    await queryInterface.removeColumn("product_categories", "image");
    await queryInterface.removeColumn("product_categories", "contentType");
  },
};
