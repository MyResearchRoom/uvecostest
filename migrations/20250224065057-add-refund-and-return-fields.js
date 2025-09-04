"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("order_items", "transactionId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "refundAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "returnTrackId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "returnQuantity", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "returnCourierCompanyId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "pickUpDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "pickUpTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("order_items", "returnStatus", {
      type: Sequelize.ENUM(
        "pending",
        "accepted",
        "refunded",
        "pickUp",
        "readyToDispatch",
        "inTransit",
        "completed",
        "cancelled",
        "rejected",
        "return"
      ),
      allowNull: true,
    });
    await queryInterface.changeColumn("order_items", "orderState", {
      type: Sequelize.ENUM(
        "processing",
        "completed",
        "cancelled",
        "return",
        "processing+return"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("order_items", "transactionId");
    await queryInterface.dropTable("order_items", "refundAmount");
    await queryInterface.dropTable("order_items", "returnTrackId");
    await queryInterface.dropTable("order_items", "returnQuantity");
    await queryInterface.dropTable("order_items", "returnCourierCompanyId");
    await queryInterface.dropTable("order_items", "pickUpDate");
    await queryInterface.dropTable("order_items", "pickUpTime");
  },
};
