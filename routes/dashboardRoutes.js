const express = require("express");
const {
  totalCountOverview,
  liveCountOverview,
  platformOverviewFilterByCompany,
  companyTotalCountOverview,
  companyLiveCountOverview,
  companyOverviewByStore,
  ownStoreOverview,
  storeLiveCountOverview,
  storeTotalCountOverview,
  orderManagerOverview,
  productManagerOverview,
  storeManagerOverview,
} = require("../controllers/dashboardController");
const authenticate = require("../middlewares/authMiddleware");

const router = express.Router();

//platfrom count overview
router.get(
  "/totalCountOverview",
  authenticate(["platformUser"]),
  totalCountOverview
);

//platform live overview
router.get("/liveCountOverview", liveCountOverview);

//platform overview filter by company
router.get("/countFilterByCompany", platformOverviewFilterByCompany);

//company count overview
router.get(
  "/totalCompanyCount",
  authenticate(["companyUser"]),
  companyTotalCountOverview
);

//company live overview
router.get(
  "/companyLiveCountOverview",
  authenticate(["companyUser"]),
  companyLiveCountOverview
);

//company overview filter by store
router.get(
  "/companyCountFilterByStore",
  authenticate(["companyUser"]),
  companyOverviewByStore
);

//store total count overview
router.get(
  "/totalStoreCount",
  authenticate(["store"]),
  storeTotalCountOverview
);

//store live count overview
router.get(
  "/storeLiveCountOverview",
  authenticate(["store"]),
  storeLiveCountOverview
);

//own store overview
router.get(
  "/ownStoreOverview",
  authenticate(["store"]),
  ownStoreOverview
);

//order manager overview -- done
router.get(
  "/orderManagerOverview",
  authenticate(["orderManager", "companyUser"]),
  orderManagerOverview
);

//product manager overview -- done
router.get(
  "/productManagerOverview",
  authenticate(["productManager", "companyUser"]),
  productManagerOverview
);

//store manager overview -- done
router.get(
  "/storeManagerOverview",
  authenticate(["store"]),
  storeManagerOverview
);


module.exports = router;
