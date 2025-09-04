const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class DistributorBusinessDocument extends Model {
    static associate(models) {
      // Association with Distributor
      DistributorBusinessDocument.belongsTo(models.Distributor, {
        foreignKey: "distributorId",
        as: "distributor",
      });
    }
  }

  DistributorBusinessDocument.init(
    {
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file: {
        type: DataTypes.BLOB("long"), // Store encrypted file buffer
        allowNull: false,
      },
      distributorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DistributorBusinessDocument",
      tableName: "distributor_business_documents",
      timestamps: true,
    }
  );

  return DistributorBusinessDocument;
};
