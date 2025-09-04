const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  raiseWarrantyClaim,
  getProductsClaimList,
  getWarrantyClaimsByProductId,
  getWarrantyClaimsById,
  getCustomerWarrantyClaimHistory,
  rejectWarrantyClaim,
  approveWarrantyClaim,
  resolveWarrantyClaim,
  getClaimsCount,
  getCustomerClaimCount,
  getCustomerClaims,
  getTopMostFivePorduct,
  getAvgClaimOfProduct,
} = require("../controllers/warrantyClaimController");
const { upload } = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/",
  authenticate(["customer"]),
  upload.fields([
    { name: "invoice", maxCount: 1 },
    { name: "warrantySlip", maxCount: 1 },
    { name: "media[]", maxCount: 3 },
  ]),
  raiseWarrantyClaim
);

//warranty claim list with claim count api
router.get(
  "/getProductsClaimList",
  authenticate(["warrantyManager"]),
  getProductsClaimList
);

//warranty claims of specific product api
router.get(
  "/getWarrantyClaimsByProductId/:productId",
  authenticate(["warrantyManager"]),
  getWarrantyClaimsByProductId
);

//warranty claim details api
router.get(
  "/getWarrantyClaimsById/:id",
  authenticate(["warrantyManager"]),
  getWarrantyClaimsById
);

//warranty claim history api
router.get(
  "/claimHistory/:customerId/:productId",
  authenticate(["warrantyManager","customer"]),
  getCustomerWarrantyClaimHistory
);

router.get(
  "/customer-claim-history/:orderItemId/:productId",
  authenticate(["customer"]),
  getCustomerWarrantyClaimHistory
);


//reject warranty claim api
router.put(
  "/reject/:claimId",
  authenticate(["warrantyManager"]),
  rejectWarrantyClaim
);

//approve warranty claim api
router.put(
  "/approve/:claimId",
  authenticate(["warrantyManager"]),
  approveWarrantyClaim
);

//resolve warranty claim api
router.put(
  "/resolve/:claimId",
  authenticate(["warrantyManager"]),
  resolveWarrantyClaim
);

//warranty claims count api
router.get(
  "/getClaimsCount",
  authenticate(["warrantyManager"]),
  getClaimsCount
);

router.get(
  "/customers",
  authenticate(["warrantyManager"]),
  getCustomerClaimCount
);

router.get(
  "/registers/:customerId",
  authenticate(["warrantyManager"]),
  getCustomerClaims
);

router.get(
  "/top-claim-products",
  authenticate(["warrantyManager"]),
  getTopMostFivePorduct
);

router.get(
  "/product-avg-claim",
  authenticate(["warrantyManager"]),
  getAvgClaimOfProduct
);

module.exports = router;
