const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class WarrantyImage extends Model {
        static associate(models) {
            WarrantyImage.belongsTo(models.WarrantyClaim, {
                foreignKey: "warrantyClaimId",
                as: "warrantyClaim",
            });
        }
    }

    WarrantyImage.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            warrantyClaimId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            image: {
                type: DataTypes.BLOB('long'),
                allowNull: false,
            },
            contentType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "WarrantyImage",
            tableName: "warranty_images",
            timestamps: true,
        }
    );

    return WarrantyImage;
};
