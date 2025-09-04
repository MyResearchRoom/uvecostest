const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/upload");
const { validate } = require("../middlewares/validations");
const {
  pricingValidationRules,
  productValidationRules,
} = require("../validations/productValidation");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  takeAction,
  setPresence,
  deleteProductImage,
  getProductsForApproval,
  getProductsByKey,
  setPricing,
  getProductsByCategory,
  approvedProducts,
  blockAction,
  getProductImages,
  getProductsWithPrice,
  getPublicProducts,
  getUniqueBrandNames,
  getSuggestion,
  sendForApproval,
} = require("../controllers/productController");
const authenticate = require("../middlewares/authMiddleware");
const {
  validateFiles,
  validateFilesForUpdate,
} = require("../middlewares/fileValidation");
const publicAuth = require("../middlewares/publicAuth");

router.post(
  "/",
  upload.fields([
    { name: "images[]", maxCount: 7 },
    { name: "video", maxCount: 1 },
  ]),
  validateFiles,
  productValidationRules,
  validate,
  authenticate(["productManager"]),
  addProduct
);

router.patch(
  "/send-for-approval/:id",
  authenticate(["companyUser", "productManager"]),
  sendForApproval
);

router.get(
  "/products-for-approval",
  authenticate(["platformUser"]),
  getProductsForApproval
);

router.get(
  "/product-images/:productId",
  authenticate(["productManager", "platformUser", "companyUser"]),
  getProductImages
);

router.put(
  "/set-presence/:id",
  authenticate(["platformUser", "companyUser", "productManager"]),
  setPresence
);

router.post(
  "/by-key/:key",
  authenticate(["platformUser", "productManager", "companyUser"]),
  getProductsByKey
);

router.get(
  "/approved-products",
  authenticate(["platformUser"]),
  approvedProducts
);

router.put("/take-action/:id", authenticate(["platformUser"]), takeAction);

router.put("/block-action/:id", authenticate(["platformUser"]), blockAction);

router.post(
  "/set-pricing/:id",
  pricingValidationRules,
  validate,
  authenticate(["companyUser"]),
  setPricing
);

router.put(
  "/:id",
  upload.fields([
    { name: "images[]", maxCount: 3 },
    { name: "video", maxCount: 1 },
  ]),
  validateFilesForUpdate,
  productValidationRules,
  authenticate(["productManager"]),
  updateProduct
);

router.delete("/:id", authenticate(["productManager"]), deleteProduct);

router.delete(
  "/product-image/:id",
  authenticate(["productManager"]),
  deleteProductImage
);

router.get("/product/:id", publicAuth(), getProductById);

router.post(
  "/list",
  authenticate(["platformUser", "productManager", "companyUser"]),
  getProducts
);

router.get(
  "/price/not-set",
  authenticate(["platformUser", "productManager", "companyUser"]),
  getProducts
);

router.get(
  "/price/set",
  authenticate(["platformUser", "productManager", "companyUser"]),
  getProducts
);

router.get(
  "/set-price-products",
  authenticate(["platformUser", "productManager", "companyUser"]),
  getProducts
);

router.get(
  "/by-category/:id",
  authenticate(["companyUser"]),
  getProductsByCategory
);

router.get(
  "/with-price",
  authenticate(["store", "orderManager", "companyUser", "warrantyManager"]),
  getProductsWithPrice
);

router.get("/search/suggestion", getSuggestion);

// public routes
router.get("/public/products", publicAuth(), getPublicProducts);

router.get("/public/products/top-deals", publicAuth(), getPublicProducts);

router.get("/brands", getUniqueBrandNames);

module.exports = router;
