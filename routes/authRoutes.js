const express = require("express");
const { upload } = require("../middlewares/upload");
const { verifyValidation, validate } = require("../middlewares/validations");
const { userValidationRules } = require("../validations/userValidation");
const { companyValidationRules } = require("../validations/companyValidation");
const {
  registerPlatformUser,
  registerCompanyUser,
  addManager,
  login,
  customerRegistration,
  getCompanies,
  getCompanyData,
  takeActionOnCompany,
  updateCompany,
  addDocument,
  deleteDocument,
  getManagers,
  deleteManager,
  updateManager,
  getCompanyNames,
  getCompanyDocuments,
  getCompanyDocument,
  updatePassword,
  refreshToken,
  logout,
  sendOTP,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");

const {
  registerLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  refreshTokenLimiter,
  resetPasswordLimiter,
} = require("../utils/rateLimiter");

const router = express.Router();

router.get("/me", authenticate([]));

router.post(
  "/platform-user",
  userValidationRules,
  validate,
  registerPlatformUser
);

router.post(
  "/company-user",
  upload.fields([{ name: "logo" }, { name: "documents[]" }]),
  companyValidationRules,
  validate,
  authenticate(["platformUser"]),
  registerCompanyUser
);

router.get("/companies", authenticate(["platformUser"]), getCompanies);

router.get("/company-names", getCompanyNames);

router.get("/company/:id", authenticate(["platformUser"]), getCompanyData);

router.get(
  "/company/documents/:id",
  authenticate(["platformUser"]),
  getCompanyDocuments
);

router.get(
  "/company/document/:id",
  authenticate(["platformUser"]),
  getCompanyDocument
);

router.put(
  "/:id",
  upload.single("logo"),
  companyValidationRules,
  validate,
  authenticate(["platformUser"]),
  updateCompany
);

router.post(
  "/add-doc/:id",
  upload.single("file"),
  authenticate(["platformUser"]),
  addDocument
);

router.delete(
  "/delete-doc/:id",
  authenticate(["platformUser"]),
  deleteDocument
);

router.put(
  "/block-company/:id",
  authenticate(["platformUser"]),
  takeActionOnCompany
);

router.post(
  "/add-manager",
  authenticate(["companyUser"]),
  userValidationRules,
  validate,
  addManager
);

router.put(
  "/manager/:id",
  authenticate(["companyUser"]),
  userValidationRules,
  validate,
  updateManager
);

router.get("/managers", authenticate(["companyUser"]), getManagers);

router.delete("/manager/:id", authenticate(["companyUser"]), deleteManager);

router.post(
  "/customer-registration",
  // registerLimiter,
  userValidationRules,
  validate,
  customerRegistration
);

// loginLimiter
router.post("/login", login);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

router.put(
  "/user/password",
  // resetPasswordLimiter,
  authenticate([]),
  updatePassword
);

router.post("/forgot-password/send-otp", sendOTP);

router.post("/forgot-password/verify-otp", verifyOTP);

router.post("/forgot-password/reset", resetPassword);

module.exports = router;

// router.post("/verify-account", verifyValidation, validate, verifyOtp);

// router.post("/choose-company", authenticate(["companyUser"]), chooseCompany);

// router.post(
//   "/add-company",
//   authenticate(["platformUser"]),
//   companyValidationRules,
//   validate,
//   addCompany
// );
