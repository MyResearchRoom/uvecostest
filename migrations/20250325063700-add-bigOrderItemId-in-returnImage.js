"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("return_images", "returnOrderId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "return_orders",
        key: "id",
      },
      onDelete: "CASCADE",
    });
    await queryInterface.addColumn("return_images", "bigOrderItemId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "big_order_items",
        key: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {},
};
