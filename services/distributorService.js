const { User, Distributor, DistributorBusinessDocument } = require("../models");
const {
  decryptSensitiveData,
  getDecryptedDocumentAsBase64,
} = require("../utils/cryptography");

exports.getDistributorById = async (id) => {
  try {
    const distributor = await Distributor.findByPk(id, {
      include: [
        {
          model: DistributorBusinessDocument,
          attributes: ["id", "fileName", "file"],
          as: "documents",
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "mobileNumber"],
        },
      ],
    });

    if (!distributor) {
      const error = new Error("Distributor not found");
      error.status = 404;
      throw error;
    }

    // Decrypt sensitive fields
    const decryptedData = {
      liscenseNumber: decryptSensitiveData(distributor.liscenseNumber),
      taxIdentificationNumber: decryptSensitiveData(
        distributor.taxIdentificationNumber
      ),
      accountNumber: decryptSensitiveData(distributor.accountNumber),
      ifscCode: decryptSensitiveData(distributor.ifscCode),
    };

    const documents = distributor.documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      file: getDecryptedDocumentAsBase64(doc.file),
    }));

    const qrCodeBase64 = `data:${
      distributor.qrCodeContentType
    };base64,${distributor.qrCode.toString("base64")}`;

    return (data = {
      ...distributor.toJSON(),
      ...decryptedData,
      qrCode: qrCodeBase64,
      documents,
      name: distributor.user.name,
      email: distributor.user.email,
      mobileNumber: distributor.user.mobileNumber,
      userId: distributor.user.id,
    });
  } catch (error) {
    throw error;
  }
};

exports.getDistributorPriceRule = async (userId) => {
  return await Distributor.findOne({
    where: { userId },
    attributes: ["id", "priceRule", "pinCode"],
  });
};

exports.getDistributorAddress = async (userId) => {
  const data = await Distributor.findOne({
    where: { userId },
    attributes: [
      "pinCode",
      "street",
      "baseAddress",
      "city",
      "district",
      "state",
      "country",
    ],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "mobileNumber"],
      },
    ],
  });

  return {
    ...data.toJSON(),
    ...data.user.toJSON(),
    user: null,
  };
};
