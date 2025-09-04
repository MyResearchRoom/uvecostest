"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("stores", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      // Personal Details
      storeType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      industryType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      comments: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      businessAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      postalCodes: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      businessLiscense: {
        type: Sequelize.BLOB("long"),
        allowNull: false,
      },
      taxIdentificationNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      panCard: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      liscenseNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // Bank Details
      bankName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ifscCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      branchName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      upiId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      qrCode: {
        type: Sequelize.BLOB("long"),
        allowNull: false,
      },
      qrCodeContentType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("stores");
  },
};

// name: {
//   type: Sequelize.STRING,
//   allowNull: false,
// },
// email: {
//   type: Sequelize.STRING,
//   allowNull: false,
//   unique: true,
//   validate: {
//     isEmail: true,
//   },
// },
// mobileNumber: {
//   type: Sequelize.STRING,
//   allowNull: false,
// },
// password: {
//   type: Sequelize.STRING,
//   allowNull: false,
// },
