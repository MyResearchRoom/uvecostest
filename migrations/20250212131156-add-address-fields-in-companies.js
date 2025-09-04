"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("companies", "primaryPinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "primaryState", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "primaryDistrict", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "secondaryPinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "secondaryState", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "secondaryDistrict", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "ownerPinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "ownerState", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "ownerDistrict", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "directorPinCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "directorState", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("companies", "directorDistrict", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("companies", "primaryPinCode");
    await queryInterface.removeColumn("companies", "primaryState");
    await queryInterface.removeColumn("companies", "primaryDistrict");
    await queryInterface.removeColumn("companies", "secondaryPinCode");
    await queryInterface.removeColumn("companies", "secondaryState");
    await queryInterface.removeColumn("companies", "secondaryDistrict");
    await queryInterface.removeColumn("companies", "ownerPinCode");
    await queryInterface.removeColumn("companies", "ownerState");
    await queryInterface.removeColumn("companies", "ownerDistrict");
    await queryInterface.removeColumn("companies", "directorPinCode");
    await queryInterface.removeColumn("companies", "directorState");
    await queryInterface.removeColumn("companies", "directorDistrict");
  },
};

// primaryPinCode,
//   primaryState,
//   primaryDistrict,
//   secondaryPinCode,
//   secondaryState,
//   secondaryDistrict,
//   ownerPinCode,
//   ownerState,
//   ownerDistrict,
//   directorPinCode,
//   directorState,
//   directorDistrict
