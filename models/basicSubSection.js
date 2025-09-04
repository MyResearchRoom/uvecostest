const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BasicSubSection extends Model {
    static associate(models) {
      BasicSubSection.belongsTo(models.BasicSection, {
        foreignKey: "basicSectionId",
        as: "basicSection",
      });
    }
  }

  BasicSubSection.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      basicSectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BasicSubSection",
      tableName: "basic_sub_sections",
      timestamps: false,
      paranoid: true,
    }
  );

  return BasicSubSection;
};
