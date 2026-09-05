const fs = require("fs");
const pool = require("../config/db");
const { splitIntoClauses } = require("../utils/clauseSplitter");
const { runReview } = require("../utils/ruleEngine");
const { buildSummaryPoints } = require("../utils/summaryGenerator");
const { extractTextFromFile } = require("../utils/fileParser");

/** Runs the full review pipeline and saves everything to the database. */
async function performReview({ title, sourceType, fullText }) {
  const clauses = splitIntoClauses(fullText);

  const [standards] = await pool.query(
    "SELECT * FROM standards WHERE active = 1"
  );

  const findings = runReview(clauses, standards);
  const summaryPoints = buildSummaryPoints(clauses);

  const matchCount = findings.filter((f) => f.status === "match").length;
  const deviationCount = findings.filter((f) => f.status === "deviation").length;
  const missingCount = findings.filter((f) => f.status === "missing").length;
  const prohibitedCount = findings.filter((f) => f.status === "prohibited_found").length;

  const overallStatus =
    deviationCount === 0 && missingCount === 0 && prohibitedCount === 0
      ? "clean"
      : "needs_review";

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [reviewResult] = await connection.query(
      `INSERT INTO reviews
        (title, source_type, full_text, overall_status, total_findings, deviation_count, missing_count, prohibited_count, match_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        sourceType,
        fullText,
        overallStatus,
        findings.length,
        deviationCount,
        missingCount,
        prohibitedCount,
        matchCount,
      ]
    );

    const reviewId = reviewResult.insertId;

    for (const f of findings) {
      await connection.query(
        `INSERT INTO findings
          (review_id, standard_id, category, label, status, quoted_clause, explanation, severity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reviewId, f.standard_id, f.category, f.label,
          f.status, f.quoted_clause, f.explanation, f.severity,
        ]
      );
    }

    let order = 0;
    for (const s of summaryPoints) {
      await connection.query(
        `INSERT INTO summary_points (review_id, heading, plain_explanation, quoted_clause, display_order)
         VALUES (?, ?, ?, ?, ?)`,
        [reviewId, s.heading, s.plain_explanation, s.quoted_clause, order++]
      );
    }

    await connection.commit();
    return reviewId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// POST /api/reviews  (pasted text)
async function createReviewFromText(req, res) {
  try {
    const { title, text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: "Please provide the lease text (at least 20 characters)." });
    }

    const reviewId = await performReview({
      title: title && title.trim() ? title.trim() : "Untitled Lease Review",
      sourceType: "pasted_text",
      fullText: text,
    });

    res.status(201).json({ id: reviewId, message: "Review completed" });
  } catch (err) {
    console.error("createReviewFromText error:", err);
    res.status(500).json({ error: "Failed to process review" });
  }
}

// POST /api/reviews/upload  (file upload, multipart/form-data)
async function createReviewFromFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = await extractTextFromFile(req.file.path, req.file.mimetype);

    if (!text || text.trim().length < 20) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Could not extract readable text from this file." });
    }

    const reviewId = await performReview({
      title: req.file.originalname,
      sourceType: "file_upload",
      fullText: text,
    });

    fs.unlink(req.file.path, () => {}); // cleanup uploaded file, text is already saved in DB

    res.status(201).json({ id: reviewId, message: "Review completed" });
  } catch (err) {
    console.error("createReviewFromFile error:", err);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: "Failed to process uploaded file" });
  }
}

// GET /api/reviews
async function getAllReviews(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, source_type, overall_status, total_findings,
              deviation_count, missing_count, prohibited_count, match_count, created_at
       FROM reviews ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("getAllReviews error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// GET /api/reviews/:id
async function getReviewById(req, res) {
  try {
    const [reviewRows] = await pool.query("SELECT * FROM reviews WHERE id = ?", [
      req.params.id,
    ]);
    if (reviewRows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    const [findings] = await pool.query(
      "SELECT * FROM findings WHERE review_id = ? ORDER BY FIELD(status, 'prohibited_found','deviation','missing','match')",
      [req.params.id]
    );

    const [summaryPoints] = await pool.query(
      "SELECT * FROM summary_points WHERE review_id = ? ORDER BY display_order ASC",
      [req.params.id]
    );

    res.json({ review: reviewRows[0], findings, summaryPoints });
  } catch (err) {
    console.error("getReviewById error:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
}

// DELETE /api/reviews/:id
async function deleteReview(req, res) {
  try {
    const [result] = await pool.query("DELETE FROM reviews WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
}

module.exports = {
  createReviewFromText,
  createReviewFromFile,
  getAllReviews,
  getReviewById,
  deleteReview,
};
