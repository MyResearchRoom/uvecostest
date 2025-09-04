const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ExtraDocument extends Model {
    static associate(models) {
      // Association with Company
      ExtraDocument.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  ExtraDocument.init(
    {
      documentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file: {
        type: DataTypes.BLOB("long"), // Store encrypted file buffer
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ExtraDocument",
      tableName: "extra_documents",
      timestamps: true,
    }
  );

  return ExtraDocument;
};
