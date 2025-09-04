"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("reviews", "productId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "products",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reviews", "productId");
  },
};
