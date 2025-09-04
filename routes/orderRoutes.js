const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  placeOrder,
  getOrders,
  getOrderDetails,
  changeOrderStatus,
  getCustomerOrders,
  generateLabel,
  getReturnImages,
  getCancelOrders,
  getReturnOrders,
  changeStatusOfCancelOrder,
  changeStatusOfReturnOrder,
  getCancelOrderDetails,
  getReturnOrderDetails,
  getCustomerOrdersHistory,
  getOrderProducts,
  changeBigOrderStatus,
  changeStatus,
  cancelOrders,
  returnOrders,
  getBigOrders,
  getBigOrderDetails,
  getBigCancelOrders,
  getBigReturnOrders,
  getDetails,
  getCancelOrderInDetails,
  getReturnOrderInDetails,
  getOrdersByCustomerId,
  getCancelOrdersByCustomerId,
  getReturnOrdersByCustomerId,
  getStoresWithTotal,
  getStoreOrders,
  getWarrantyProducts,
  getOrderProduct,
} = require("../controllers/orderController");

const { validate } = require("../middlewares/validations");
const {
  placeOrderValidationRules,
  changeOrderStatusValidationRules,
  orderReturnValidationRules,
  cancelOrderValidationRules,
  cancelOrderStatusValidationRules,
  returnOrderStatusValidationRules,
  changeBigOrderStatusValidationRules,
} = require("../validations/onlineOrderValidation");
const { upload } = require("../middlewares/upload");
const { validateFiles } = require("../middlewares/fileValidation");

const router = express.Router();

router.post(
  "/",
  placeOrderValidationRules,
  validate,
  authenticate(["customer", "distributor", "store"]),
  placeOrder
);

// API for MANAGEMENT
router.get("/", authenticate(["store", "orderManager"]), getOrders);

// API for MANAGEMENT
router.get(
  "/cancel/orders",
  authenticate(["store", "orderManager"]),
  getCancelOrders
);

// API for MANAGEMENT
router.get(
  "/return/orders",
  authenticate(["store", "orderManager"]),
  getReturnOrders
);

router.get(
  "/big/orders",
  authenticate(["store", "orderManager"]),
  getBigOrders
);

router.get(
  "/big/store/orders",
  authenticate(["orderManager", "store"]),
  getBigOrders
);

router.get(
  "/big/cancel/orders",
  authenticate(["store", "orderManager"]),
  getBigCancelOrders
);

router.get(
  "/big/store/cancel/orders",
  authenticate(["orderManager"]),
  getBigCancelOrders
);

router.get(
  "/big/return/orders",
  authenticate(["store", "orderManager"]),
  getBigReturnOrders
);

router.get(
  "/big/store/return/orders",
  authenticate(["orderManager"]),
  getBigReturnOrders
);

router.get(
  "/big/:orderId/order",
  authenticate(["store", "orderManager"]),
  getBigOrderDetails
);

// API for BOTH --> MANAGEMENT
router.get(
  "/:orderId",
  authenticate(["store", "orderManager"]),
  getOrderDetails
);

// API for BOTH
router.get(
  "/:joinId/cancel",
  authenticate(["store", "orderManager"]),
  getCancelOrderDetails
);

// API for BOTH
router.get(
  "/:joinId/return",
  authenticate(["store", "orderManager"]),
  getReturnOrderDetails
);

// API for CUSTOMER
router.put(
  "/:orderId/return",
  upload.fields([{ name: "images[]" }]),
  validateFiles,
  orderReturnValidationRules,
  validate,
  authenticate(["customer"]),
  changeStatus
);

// API for CUSTOMER
router.put(
  "/:orderId/cancel",
  cancelOrderValidationRules,
  validate,
  authenticate(["customer"]),
  changeStatus
);

// API for MANAGEMENT
router.put(
  "/:orderId/status",
  changeOrderStatusValidationRules,
  validate,
  authenticate(["store"]),
  changeOrderStatus
);

// API for MANAGEMENT
router.put(
  "/big/:orderId/status",
  changeBigOrderStatusValidationRules,
  validate,
  authenticate(["store"]),
  changeBigOrderStatus
);

// API for MANAGEMENT
router.put(
  "/cancel/:orderId/status",
  cancelOrderStatusValidationRules,
  validate,
  authenticate(["store"]),
  changeStatusOfCancelOrder
);

// API for MANAGEMENT
router.put(
  "/return/:orderId/status",
  returnOrderStatusValidationRules,
  validate,
  authenticate(["store"]),
  changeStatusOfReturnOrder
);

// API for MANAGEMENT
router.get(
  "/:orderId/generatelabel",
  authenticate(["store", "orderManager"]),
  generateLabel
);

// API for MANAGEMENT
router.get(
  "/:orderId/return/images",
  authenticate(["store", "orderManager"]),
  getReturnImages
);

// ==================================== API's for CUSTOMER (Web screen) ==================================== //

router.get(
  "/:joinId/processing",
  authenticate(["customer", "distributor", "store"]),
  getDetails
);

router.get(
  "/:joinId/cancel/order",
  authenticate(["customer", "distributor"]),
  getCancelOrderInDetails
);

router.get(
  "/:joinId/return/order",
  authenticate(["customer", "distributor"]),
  getReturnOrderInDetails
);

router.get(
  "/customer/orders",
  authenticate(["customer", "distributor", "store"]),
  getCustomerOrders
);

router.get(
  "/customer/:orderId/order-products",
  authenticate(["customer", "distributor", "store"]),
  getOrderProducts
);

router.get(
  "/customer/cancel/orders",
  authenticate(["customer", "distributor"]),
  cancelOrders
);

router.get(
  "/customer/return/orders",
  authenticate(["customer", "distributor"]),
  returnOrders
);

router.get(
  "/customer/history/orders",
  authenticate(["customer", "distributor"]),
  getCustomerOrdersHistory
);

// ==================================== API's for PLATFORM_USER (Admin screen) ==================================== //
router.get(
  "/platform/orders/:customerId",
  authenticate(["platformUser"]),
  getOrdersByCustomerId
);

router.get(
  "/platform/cancel-orders/:customerId",
  authenticate(["platformUser"]),
  getCancelOrdersByCustomerId
);

router.get(
  "/platform/return-orders/:customerId",
  authenticate(["platformUser"]),
  getReturnOrdersByCustomerId
);

router.get(
  "/store/history/:companyId",
  authenticate(["platformUser"]),
  getStoresWithTotal
);

router.get(
  "/store/:storeId",
  authenticate(["platformUser", "companyUser"]),
  getStoreOrders
);

router.get(
  "/warranty-products/:orderId",
  authenticate(["store"]),
  getWarrantyProducts
);

router.get(
  "/order-product/:joinId",
  authenticate(["customer"]),
  getOrderProduct
);

module.exports = router;
