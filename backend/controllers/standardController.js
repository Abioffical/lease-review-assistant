const pool = require("../config/db");

// GET /api/standards
async function getAllStandards(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM standards ORDER BY rule_type, category"
    );
    res.json(rows);
  } catch (err) {
    console.error("getAllStandards error:", err);
    res.status(500).json({ error: "Failed to fetch standards" });
  }
}

// GET /api/standards/:id
async function getStandardById(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM standards WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Standard not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getStandardById error:", err);
    res.status(500).json({ error: "Failed to fetch standard" });
  }
}

// POST /api/standards
async function createStandard(req, res) {
  try {
    const {
      category, label, rule_type, min_value, max_value,
      unit, keywords, description, severity,
    } = req.body;

    if (!category || !label || !rule_type || !keywords || !description) {
      return res.status(400).json({
        error: "category, label, rule_type, keywords and description are required",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO standards
        (category, label, rule_type, min_value, max_value, unit, keywords, description, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category, label, rule_type,
        min_value ?? null, max_value ?? null, unit ?? null,
        keywords, description, severity || "medium",
      ]
    );

    const [rows] = await pool.query("SELECT * FROM standards WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createStandard error:", err);
    res.status(500).json({ error: "Failed to create standard" });
  }
}

// PUT /api/standards/:id
async function updateStandard(req, res) {
  try {
    const {
      category, label, rule_type, min_value, max_value,
      unit, keywords, description, severity, active,
    } = req.body;

    const [existing] = await pool.query("SELECT * FROM standards WHERE id = ?", [
      req.params.id,
    ]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Standard not found" });
    }

    const current = existing[0];

    await pool.query(
      `UPDATE standards SET
        category = ?, label = ?, rule_type = ?, min_value = ?, max_value = ?,
        unit = ?, keywords = ?, description = ?, severity = ?, active = ?
       WHERE id = ?`,
      [
        category ?? current.category,
        label ?? current.label,
        rule_type ?? current.rule_type,
        min_value ?? current.min_value,
        max_value ?? current.max_value,
        unit ?? current.unit,
        keywords ?? current.keywords,
        description ?? current.description,
        severity ?? current.severity,
        active ?? current.active,
        req.params.id,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM standards WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error("updateStandard error:", err);
    res.status(500).json({ error: "Failed to update standard" });
  }
}

// DELETE /api/standards/:id
async function deleteStandard(req, res) {
  try {
    const [result] = await pool.query("DELETE FROM standards WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Standard not found" });
    }
    res.json({ message: "Standard deleted" });
  } catch (err) {
    console.error("deleteStandard error:", err);
    res.status(500).json({ error: "Failed to delete standard" });
  }
}

module.exports = {
  getAllStandards,
  getStandardById,
  createStandard,
  updateStandard,
  deleteStandard,
};
