const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CompanySliderImage extends Model {}

  CompanySliderImage.init(
    {
      image: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      contentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("offerSlider", "heroSlider"),
        allowNull: false,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CompanySliderImage",
      tableName: "company_slider_images",
      timestamps: false,
    }
  );

  return CompanySliderImage;
};
