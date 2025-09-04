"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("order_items", "productId");
    await queryInterface.removeColumn("order_items", "orderState");
    await queryInterface.removeColumn("order_items", "price");
    await queryInterface.removeColumn("order_items", "gst");
    await queryInterface.removeColumn("order_items", "quantity");
    await queryInterface.removeColumn("order_items", "reason");
    await queryInterface.removeColumn("order_items", "requestedAt");
    await queryInterface.removeColumn("order_items", "refundAmount");
    await queryInterface.removeColumn("order_items", "returnTrackId");
    await queryInterface.removeColumn("order_items", "returnCourierCompanyId");
    await queryInterface.removeColumn("order_items", "returnQuantity");
    await queryInterface.removeColumn("order_items", "pickUpDate");
    await queryInterface.removeColumn("order_items", "pickUpTime");
    await queryInterface.removeColumn("order_items", "returnStatus");
    await queryInterface.removeColumn("order_items", "returnRefundAmount");
    await queryInterface.removeColumn("order_items", "courierAmount");
    await queryInterface.removeColumn("order_items", "otherAmount");
    await queryInterface.removeColumn("order_items", "handlingAmount");
    await queryInterface.removeColumn("order_items", "comment");

    // Modify existing columns
    await queryInterface.changeColumn("order_items", "orderStatus", {
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
        "return",
        "received"
      ),
      allowNull: false,
    });

    await queryInterface.changeColumn("order_items", "subTotal", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn("order_items", "deliveryAddressId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn("order_items", "deliveredAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn("order_items", "shipDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn("order_items", "trackId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("order_items", "warrantyCode", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("order_items", "note", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("order_items", "courierCompanyId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Re-add removed columns in case of rollback
    // await queryInterface.addColumn("order_items", "productId", {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // });
    // await queryInterface.addColumn("order_items", "orderState", {
    //   type: Sequelize.ENUM(
    //     "processing",
    //     "completed",
    //     "cancelled",
    //     "return",
    //     "processing+return"
    //   ),
    //   allowNull: false,
    // });
    // await queryInterface.addColumn("order_items", "price", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: false,
    // });
    // await queryInterface.addColumn("order_items", "gst", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: false,
    // });
    // await queryInterface.addColumn("order_items", "quantity", {
    //   type: Sequelize.INTEGER,
    //   allowNull: false,
    // });
    // await queryInterface.addColumn("order_items", "reason", {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "requestedAt", {
    //   type: Sequelize.DATE,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "refundAmount", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "returnTrackId", {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "returnCourierCompanyId", {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "returnQuantity", {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "pickUpDate", {
    //   type: Sequelize.DATE,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "pickUpTime", {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "returnStatus", {
    //   type: Sequelize.ENUM(
    //     "pending",
    //     "accepted",
    //     "refunded",
    //     "pickUp",
    //     "readyToDispatch",
    //     "inTransit",
    //     "completed",
    //     "cancelled",
    //     "rejected",
    //     "return",
    //     "received"
    //   ),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "returnRefundAmount", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "courierAmount", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "otherAmount", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "handlingAmount", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("order_items", "comment", {
    //   type: Sequelize.TEXT,
    //   allowNull: true,
    // });
  },
};
