const express = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const supplierRoutes = require("./supplierRoutes");
const distributorRoutes = require("./distributorRoutes");
const storeRoutes = require("./storeRoutes");
const priceruleRoutes = require("./priceRuleRoutes");
const productCategoryRoutes = require("./productCategoryRoutes");
const basicSectionRoutes = require("./basicSectionRoutes");
const mainCategoryRoutes = require("./mainCategoryRoutes");
const sliderImageRoutes = require("./sliderImageRoutes");
const pinCodeRoutes = require("./pinCodeRoutes");
const customerAddressRoutes = require("./customerAddressRoutes");
const offlineOrderRoutes = require("./offlineOrderRoutes");
const cartRoutes = require("./cartRoutes");
const wishlistRoutes = require("./wishlistRoutes");
const orderRoutes = require("./orderRoutes");
const warrantyListRoutes = require("./warrantyListRoutes");
const returnListRoutes = require("./returnListRoutes");
const stockHistoryRoutes = require("./stockHistoryRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reviewRoutes = require("./reviewRoutes");
const invoiceRoutes = require("./invoiceRoutes");
const paymentRoutes = require("./paymentRoutes");
const warrantyClaimRoutes = require("./warrantyClaimRoutes");

const router = express.Router();

// Test route
router.use("/test", (req, res) => res.send("<h1>This is a test API_03092025</h1>"));

// All actual routes
router.use("/api/auth", authRoutes);
router.use("/api/user", userRoutes);
router.use("/api/product", productRoutes);
router.use("/api/supplier", supplierRoutes);
router.use("/api/distributor", distributorRoutes);
router.use("/api/store", storeRoutes);
router.use("/api/pricerule", priceruleRoutes);
router.use("/api/productcategory", productCategoryRoutes);
router.use("/api/basic-section", basicSectionRoutes);
router.use("/api/main-category", mainCategoryRoutes);
router.use("/api/slider-image", sliderImageRoutes);
router.use("/api/pincode", pinCodeRoutes);
router.use("/api/customer-address", customerAddressRoutes);
router.use("/api/offline-order", offlineOrderRoutes);
router.use("/api/cart", cartRoutes);
router.use("/api/wishlist", wishlistRoutes);
router.use("/api/order", orderRoutes);
router.use("/api/warranty-list", warrantyListRoutes);
router.use("/api/return-list", returnListRoutes);
router.use("/api/stock-history", stockHistoryRoutes);
router.use("/api/count", dashboardRoutes);
router.use("/api/review", reviewRoutes);
router.use("/api/invoice", invoiceRoutes);
router.use("/api/payment", paymentRoutes);
router.use("/api/warrantyClaim", warrantyClaimRoutes);

module.exports = router;
