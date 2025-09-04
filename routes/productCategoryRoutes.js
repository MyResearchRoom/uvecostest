const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  addProdctCategory,
  getAllCategories,
  updateProductCategory,
  deleteProductCategory,
  addProdctSubCategory,
  getAllSubCategories,
  updateProductSubCategory,
  deleteProductSubCategory,
  getCompanyWithProductCategoryCount,
  unMapped,
  getAllCategoriesWithPagination,
} = require("../controllers/productCategoryController");
const { upload } = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  authenticate(["productManager"]),
  addProdctCategory
);

router.get(
  "/",
  authenticate(["productManager", "companyUser"]),
  getAllCategories
);

router.get(
  "/rejected",
  authenticate(["productManager", "companyUser"]),
  getAllCategoriesWithPagination
);

router.put(
  "/:id",
  upload.single("image"),
  authenticate(["productManager"]),
  updateProductCategory
);

router.delete("/:id", authenticate(["productManager"]), deleteProductCategory);

router.post(
  "/subcategory/",
  authenticate(["productManager"]),
  addProdctSubCategory
);

router.get(
  "/subcategories/:id",
  authenticate(["productManager"]),
  getAllSubCategories
);

router.put(
  "/subcategory/:id",
  authenticate(["productManager"]),
  updateProductSubCategory
);

router.delete(
  "/subcategory/:id",
  authenticate(["productManager"]),
  deleteProductSubCategory
);

router.get(
  "/company-category-count",
  authenticate(["platformUser"]),
  getCompanyWithProductCategoryCount
);

router.get(
  "/approved/categories/:companyId",
  authenticate(["platformUser"]),
  getAllCategories
);

router.get(
  "/requested/categories/:companyId",
  authenticate(["platformUser"]),
  getAllCategories
);

router.put("/:id/unmapped", authenticate(["platformUser"]), unMapped);

// Public routes
router.get("/public/categories", getAllCategories);
router.get("/public/subcategories/:id", getAllSubCategories);

module.exports = router;
