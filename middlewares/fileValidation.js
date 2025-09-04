const { imageFormats } = require("../utils/constants");

const fileRules = {
  "files[]": {
    maxSize: 10 * 1024 * 1024, // 10MB
    types: ["application/pdf"],
    sizeMessage: "Each file must not exceed 10MB in size.",
    typeMessage: "All files must be in PDF format.",
  },
  "documents[]": {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ["application/pdf"],
    sizeMessage: "Each document must not exceed 5MB in size.",
    typeMessage: "All documents must be in PDF format.",
  },
  qrCode: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: imageFormats,
    sizeMessage: "The QR code image must not exceed 5MB in size.",
    typeMessage: "The QR code must be an image.",
  },
  "images[]": {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: imageFormats,
    sizeMessage: "Each image must not exceed 5MB in size.",
    typeMessage: "Only images are allowed.",
  },
  "sliderImages[]": {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: imageFormats,
    sizeMessage: "Each image must not exceed 5MB in size.",
    typeMessage: "Only images are allowed.",
  },
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    types: ["video/mp4"],
    sizeMessage: "The video file must not exceed 20MB in size.",
    typeMessage: "The video file must be in MP4 format.",
  },
  businessLiscense: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ["application/pdf"],
    sizeMessage: "The business license document must not exceed 2MB in size.",
    typeMessage: "The business license document must be in PDF format.",
  },
  panCard: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ["application/pdf"],
    sizeMessage: "The PAN card document must not exceed 2MB in size.",
    typeMessage: "The PAN card document must be in PDF format.",
  },
  file: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ["application/pdf"],
    sizeMessage: "The file must not exceed 2MB in size.",
    typeMessage: "The file must be in PDF format.",
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: imageFormats,
    sizeMessage: "Image must not exceed 5MB in size.",
    typeMessage: "Only image is allowed.",
  },
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: imageFormats,
    sizeMessage: "Image must not exceed 5MB in size.",
    typeMessage: "Only images are allowed.",
  },
};

const validateFiles = (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      const rules = fileRules[fieldName];

      if (!rules) continue;

      files.forEach((file) => {
        if (file.size > rules.maxSize) {
          throw new Error(rules.sizeMessage);
        }
        if (!rules.types.includes(file.mimetype)) {
          throw new Error(rules.typeMessage);
        }
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

const validateFilesForUpdate = (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    for (const fieldName in req.files) {
      const files = req.files[fieldName];
      const rules = fileRules[fieldName];

      if (!rules) continue;

      files.forEach((file) => {
        if (file.size > rules.maxSize) {
          throw new Error(rules.sizeMessage);
        }

        if (!rules.types.includes(file.mimetype)) {
          throw new Error(rules.typeMessage);
        }
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { validateFiles, validateFilesForUpdate };
