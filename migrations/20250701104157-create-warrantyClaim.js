'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('warranty_claims', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order_items', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      serialNo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      claimId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      issue: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      invoice: {
        type: Sequelize.BLOB('long'),
        allowNull: false,
      },
      invoiceType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      warrantySlip: {
        type: Sequelize.BLOB('long'),
        allowNull: false,
      },
      warrantySlipType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'resolved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      resolutionSummary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejectReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('warranty_claims');
  }
};
