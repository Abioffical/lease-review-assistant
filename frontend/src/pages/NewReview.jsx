import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitTextReview, submitFileReview } from "../api/api";
import "../styles/pages.css";

export default function NewReview() {
  const [mode, setMode] = useState("paste"); // "paste" | "upload"
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "paste" && text.trim().length < 20) {
      setError("Please paste at least a few sentences of the lease agreement.");
      return;
    }
    if (mode === "upload" && !file) {
      setError("Please choose a .pdf or .txt file to upload.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "paste"
          ? await submitTextReview(title, text)
          : await submitFileReview(file);
      navigate(`/reviews/${result.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong while processing the review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Review a Lease Agreement</h1>
      <p className="page-subtitle">
        Paste the agreement text or upload a file. The system checks it clause by clause
        against the company's standard positions and produces a report for a human reviewer.
      </p>

      <div className="mode-toggle">
        <button
          className={mode === "paste" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setMode("paste")}
          type="button"
        >
          Paste Text
        </button>
        <button
          className={mode === "upload" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setMode("upload")}
          type="button"
        >
          Upload File (.pdf / .txt)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="review-form">
        {mode === "paste" ? (
          <>
            <label className="form-label" htmlFor="title">
              Agreement title (optional)
            </label>
            <input
              id="title"
              type="text"
              className="text-input"
              placeholder="e.g. 45 Lake View Road - Tenant Lease"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="form-label" htmlFor="leaseText">
              Lease agreement text
            </label>
            <textarea
              id="leaseText"
              className="lease-textarea"
              placeholder="Paste the full lease agreement text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={16}
            />
          </>
        ) : (
          <>
            <label className="form-label" htmlFor="leaseFile">
              Lease agreement file
            </label>
            <input
              id="leaseFile"
              type="file"
              accept=".pdf,.txt"
              className="file-input"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <p className="file-selected">Selected: {file.name}</p>}
          </>
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Analyzing agreement..." : "Run Review"}
        </button>
      </form>
    </div>
  );
}
