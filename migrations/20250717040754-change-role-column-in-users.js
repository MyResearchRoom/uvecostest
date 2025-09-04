"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(
        "platformUser",
        "companyUser",
        "orderManager",
        "productManager",
        "warrantyManager",
        "distributor",
        "store",
        "customer"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(
        "platformUser",
        "companyUser",
        "orderManager",
        "productManager",
        "distributor",
        "store",
        "customer"
      ),
      allowNull: false,
    });
  },
};
