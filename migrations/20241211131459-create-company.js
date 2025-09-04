"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("companies", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Company Details
      companyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      companyType: {
        type: Sequelize.STRING,
        allowNull: true, // Optional
      },
      businessRegistrationNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      licenseNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      panNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gstNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tanNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cinNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateOfEstablishment: {
        type: Sequelize.DATEONLY,
        allowNull: true, // Optional
      },
      industryType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      websiteUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      taxIdentificationNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      productsCategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // Contact Details
      secondaryContactPersonName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      secondaryEmail: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      secondaryPhoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      companyAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // Director Details
      ownerFullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ownerEmailId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ownerPhoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ownerAddress: {
        type: Sequelize.STRING,
        allowNull: true, // Optional
      },

      // Director Details
      directorFullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      directorEmailId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      directorPhoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      directorAddress: {
        type: Sequelize.STRING,
        allowNull: true, // Optional
      },
      dinNumber: {
        type: Sequelize.STRING,
        allowNull: true, // Optional
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },

      // Bank Details (all fields optional)
      accountHolderName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      branchName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ifscCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      upiId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isBlock: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      // Metadata
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("companies");
  },
};
