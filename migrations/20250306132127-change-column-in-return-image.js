"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Rename column orderItemId to returnOrderId
    await queryInterface.renameColumn(
      "return_images",
      "orderItemId",
      "returnOrderId"
    );

    // Step 2: Change foreign key reference for returnOrderId
    await queryInterface.changeColumn("return_images", "returnOrderId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "return_orders",
        key: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {},
};
