const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BasicSection extends Model {
    static associate(models) {
      BasicSection.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  BasicSection.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BasicSection",
      tableName: "basic_sections",
      timestamps: false,
      paranoid: true,
    }
  );

  return BasicSection;
};
