("use strict");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("distributors", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      // Personal Details
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      district: {
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

      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      productsCategory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      taxIdentificationNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      liscenseNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },

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
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("distributors");
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
// },
// mobileNumber: {
//   type: Sequelize.STRING,
//   allowNull: false,
// },
// password: {
//   type: Sequelize.STRING,
//   allowNull: false,
// },
