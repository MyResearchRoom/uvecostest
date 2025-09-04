'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('warranty_claims', "warrantyCode", {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.changeColumn("warranty_claims", "warrantySlip", {
      type: Sequelize.BLOB("long"),
      allowNull: true
    })
    await queryInterface.changeColumn("warranty_claims", "warrantySlipType", {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('warranty_claims', "warrantyCode");
    await queryInterface.changeColumn("warranty_claims", "warrantySlip", {
      type: Sequelize.BLOB("long"),
      allowNull: false
    })
    await queryInterface.changeColumn("warranty_claims", "warrantySlipType", {
      type: Sequelize.STRING,
      allowNull: false
    })
  }
};