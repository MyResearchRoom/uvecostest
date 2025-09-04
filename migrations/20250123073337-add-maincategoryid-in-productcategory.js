"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_categories", "mainCategoryId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "main_categories",
        key: "id",
      },
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("product_categories", "rejectStatus", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn("product_categories", "rejectNote", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("product_categories", "mainCategoryId");
    await queryInterface.removeColumn("product_categories", "rejectNote");
    await queryInterface.removeColumn("product_categories", "rejectStatus");
  },
};
