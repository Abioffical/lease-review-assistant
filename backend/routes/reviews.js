const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  createReviewFromText,
  createReviewFromFile,
  getAllReviews,
  getReviewById,
  deleteReview,
} = require("../controllers/reviewController");

// Store uploads temporarily on disk; the extracted text is what
// actually gets saved to the database. The file itself is deleted
// right after text extraction (see reviewController.js).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Only .pdf and .txt files are supported"));
  },
});

router.get("/", getAllReviews);
router.get("/:id", getReviewById);
router.post("/", createReviewFromText);
router.post("/upload", upload.single("leaseFile"), createReviewFromFile);
router.delete("/:id", deleteReview);

module.exports = router;
