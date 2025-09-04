"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      productCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_categories",
          key: "id",
        },
      },
      productSubCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "product_sub_categories",
          key: "id",
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      video: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },
      videoContentType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stockLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stockThresholdLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isBlock: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      block: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      productStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      originalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      gst: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      warranty: {
        type: Sequelize.STRING, // Assuming warranty could be '6 months', '1 year', etc.
        allowNull: true,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "companies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("products");
  },
};
