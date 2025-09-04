const express = require("express");
const router = express.Router();
const {
  createMainCategory,
  getAllMainCategories,
  getAllMainCategoriesNames,
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory,
  connectCategories,
  rejectCategories,
  getAllMainCategoriesImages,
} = require("../controllers/mainCategoryController");
const authenticate = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/upload");

router.post(
  "/",
  upload.single("image"),
  authenticate(["platformUser"]),
  createMainCategory
);

router.get("/", getAllMainCategories);

router.get("/list/names", getAllMainCategoriesNames);

router.get("/list/images", getAllMainCategoriesImages);

router.get("/:id", getMainCategoryById);

router.put(
  "/:id",
  upload.single("image"),
  authenticate(["platformUser"]),
  updateMainCategory
);

router.delete("/:id", authenticate(["platformUser"]), deleteMainCategory);

router.post(
  "/connect-categories",
  authenticate(["platformUser"]),
  connectCategories
);

router.post(
  "/reject-categories",
  authenticate(["platformUser"]),
  rejectCategories
);

module.exports = router;
