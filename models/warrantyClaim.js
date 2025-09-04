const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class WarrantyClaim extends Model {
    static associate(models) {
      WarrantyClaim.belongsTo(models.User, {
        foreignKey: "customerId",
        as: "customer",
      });
      WarrantyClaim.belongsTo(models.Product, {
        foreignKey: "productId",
        as: "product",
      });
      WarrantyClaim.belongsTo(models.OrderItem, {
        foreignKey: "orderId",
        as: "order",
      });
      WarrantyClaim.hasMany(models.WarrantyImage, {
        foreignKey: "warrantyClaimId",
        as: "images",
      });
    }
  }

  WarrantyClaim.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      serialNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      claimId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      issue: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      invoice: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      invoiceType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      warrantySlip: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
      },
      warrantySlipType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "resolved"),
        allowNull: false,
        defaultValue: "pending",
      },
      resolutionSummary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      warrantyCode: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: "WarrantyClaim",
      tableName: "warranty_claims",
      timestamps: true,
    }
  );

  return WarrantyClaim;
};
