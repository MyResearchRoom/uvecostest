"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "mrp", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "discount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "cod", {
      type: Sequelize.ENUM("yes", "no"),
      allowNull: true,
    });
    await queryInterface.changeColumn("products", "shipping", {
      type: Sequelize.ENUM("free", "paid", "exclude", "include"),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "height", {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "weight", {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "width", {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
    });
    await queryInterface.addColumn("products", "length", {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "mrp");
    await queryInterface.removeColumn("products", "discount");
    await queryInterface.removeColumn("products", "cod");
    await queryInterface.removeColumn("products", "height");
    await queryInterface.removeColumn("products", "weight");
    await queryInterface.removeColumn("products", "width");
    await queryInterface.removeColumn("products", "length");
  },
};
