const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PlatformSliderImage extends Model {}

  PlatformSliderImage.init(
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
    },
    {
      sequelize,
      modelName: "PlatformSliderImage",
      tableName: "platform_slider_images",
      timestamps: false,
    }
  );

  return PlatformSliderImage;
};
