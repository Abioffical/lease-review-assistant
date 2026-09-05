const express = require("express");
const router = express.Router();
const {
  getAllStandards,
  getStandardById,
  createStandard,
  updateStandard,
  deleteStandard,
} = require("../controllers/standardController");

router.get("/", getAllStandards);
router.get("/:id", getStandardById);
router.post("/", createStandard);
router.put("/:id", updateStandard);
router.delete("/:id", deleteStandard);

module.exports = router;
