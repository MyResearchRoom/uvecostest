const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  addBasicSection,
  getAllSections,
  updateBasicSection,
  deleteBasicSection,
  addBasicSubSection,
  getAllSubSections,
  updateBasicSubSection,
  deleteBasicSubSection,
} = require("../controllers/basicSectionController");

const router = express.Router();

router.post("/", authenticate(["productManager"]), addBasicSection);

router.get(
  "/",
  authenticate(["productManager", "companyUser"]),
  getAllSections
);

router.put("/:id", authenticate(["productManager"]), updateBasicSection);

router.delete("/:id", authenticate(["productManager"]), deleteBasicSection);

router.post(
  "/sub-section/",
  authenticate(["productManager"]),
  addBasicSubSection
);

router.get(
  "/sub-section/:id",
  authenticate(["productManager"]),
  getAllSubSections
);

router.put(
  "/sub-section/:id",
  authenticate(["productManager"]),
  updateBasicSubSection
);

router.delete(
  "/sub-section/:id",
  authenticate(["productManager"]),
  deleteBasicSubSection
);

module.exports = router;
