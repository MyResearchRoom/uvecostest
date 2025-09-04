const express = require("express");
const { upload } = require("../middlewares/upload");
const {
  addPlatformSliderImage,
  deletePlatformSliderImage,
  addCompanySliderImage,
  deleteCompanySliderImage,
  getPlatformSliderImages,
  getCompanySliderImages,
} = require("../controllers/sliderImageController");
const authenticate = require("../middlewares/authMiddleware");
const { validateFiles } = require("../middlewares/fileValidation");
const router = express.Router();

router.post(
  "/platform",
  upload.array("sliderImages[]"),
  validateFiles,
  authenticate(["platformUser"]),
  addPlatformSliderImage
);

router.delete(
  "/platform/:id",
  authenticate(["platformUser"]),
  deletePlatformSliderImage
);

router.get("/platform", getPlatformSliderImages);

router.post(
  "/company",
  upload.array("sliderImages[]"),
  validateFiles,
  authenticate(["companyUser"]),
  addCompanySliderImage
);

router.delete(
  "/company/:id",
  authenticate(["companyUser"]),
  deleteCompanySliderImage
);

router.get("/company", getCompanySliderImages);

router.get(
  "/company-user",
  authenticate(["companyUser"]),
  getCompanySliderImages
);

module.exports = router;
