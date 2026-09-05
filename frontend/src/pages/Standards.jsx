import { useEffect, useState } from "react";
import { getStandards, createStandard, updateStandard, deleteStandard } from "../api/api";
import "../styles/pages.css";

const EMPTY_FORM = {
  category: "",
  label: "",
  rule_type: "required_clause",
  min_value: "",
  max_value: "",
  unit: "",
  keywords: "",
  description: "",
  severity: "medium",
};

const RULE_TYPE_LABELS = {
  range: "Acceptable Range",
  required_clause: "Required Clause",
  prohibited: "Prohibited Term",
};

export default function Standards() {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function loadStandards() {
    setLoading(true);
    getStandards().then(setStandards).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStandards();
  }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError("");
  }

  function startEdit(standard) {
    setForm({
      category: standard.category,
      label: standard.label,
      rule_type: standard.rule_type,
      min_value: standard.min_value ?? "",
      max_value: standard.max_value ?? "",
      unit: standard.unit ?? "",
      keywords: standard.keywords,
      description: standard.description,
      severity: standard.severity,
    });
    setEditingId(standard.id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.category || !form.label || !form.keywords || !form.description) {
      setError("Category, label, keywords, and description are required.");
      return;
    }

    const payload = {
      ...form,
      min_value: form.min_value === "" ? null : Number(form.min_value),
      max_value: form.max_value === "" ? null : Number(form.max_value),
      unit: form.unit || null,
    };

    try {
      if (editingId) {
        await updateStandard(editingId, payload);
      } else {
        await createStandard(payload);
      }
      setShowForm(false);
      loadStandards();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save standard.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this standard? Future reviews will no longer check for it.")) return;
    await deleteStandard(id);
    loadStandards();
  }

  const grouped = {
    range: standards.filter((s) => s.rule_type === "range"),
    required_clause: standards.filter((s) => s.rule_type === "required_clause"),
    prohibited: standards.filter((s) => s.rule_type === "prohibited"),
  };

  return (
    <div className="page">
      <div className="review-header">
        <div>
          <h1>Standards Playbook</h1>
          <p className="page-subtitle">
            This is exactly what the review engine checks every lease against. Edit these
            to change what counts as a match, deviation, missing protection, or prohibited term.
          </p>
        </div>
        <button className="primary-btn" onClick={startCreate}>+ Add Standard</button>
      </div>

      {showForm && (
        <form className="standard-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Standard" : "New Standard"}</h3>

          <div className="form-row">
            <div>
              <label className="form-label">Category (internal key)</label>
              <input
                className="text-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. pet_policy"
              />
            </div>
            <div>
              <label className="form-label">Label (shown in reports)</label>
              <input
                className="text-input"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Pet Policy Clause"
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label className="form-label">Rule Type</label>
              <select
                className="text-input"
                value={form.rule_type}
                onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
              >
                <option value="required_clause">Required Clause</option>
                <option value="range">Acceptable Range</option>
                <option value="prohibited">Prohibited Term</option>
              </select>
            </div>
            <div>
              <label className="form-label">Severity</label>
              <select
                className="text-input"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {form.rule_type === "range" && (
            <div className="form-row">
              <div>
                <label className="form-label">Min Value</label>
                <input
                  type="number"
                  className="text-input"
                  value={form.min_value}
                  onChange={(e) => setForm({ ...form, min_value: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Max Value</label>
                <input
                  type="number"
                  className="text-input"
                  value={form.max_value}
                  onChange={(e) => setForm({ ...form, max_value: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <input
                  className="text-input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="days or months_rent"
                />
              </div>
            </div>
          )}

          <label className="form-label">Keywords (comma-separated, used to find matching clauses)</label>
          <input
            className="text-input"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            placeholder="e.g. pet deposit,no pets,pets are not allowed"
          />

          <label className="form-label">Description (plain-language explanation)</label>
          <textarea
            className="lease-textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="primary-btn">Save</button>
            <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading standards...</p>
      ) : (
        Object.entries(grouped).map(([type, list]) => (
          <section className="report-section" key={type}>
            <h2>{RULE_TYPE_LABELS[type]}</h2>
            {list.length === 0 ? (
              <p className="empty-state">No standards of this type yet.</p>
            ) : (
              list.map((s) => (
                <div key={s.id} className="standard-card">
                  <div className="finding-header">
                    <h4>{s.label}</h4>
                    <span className={`severity-tag severity-${s.severity}`}>{s.severity}</span>
                  </div>
                  <p>{s.description}</p>
                  {s.rule_type === "range" && (
                    <p className="standard-range">
                      Accepted range: {s.min_value} - {s.max_value} {s.unit}
                    </p>
                  )}
                  <p className="standard-keywords">Keywords: {s.keywords}</p>
                  <div className="form-actions">
                    <button className="secondary-btn" onClick={() => startEdit(s)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </section>
        ))
      )}
    </div>
  );
}
