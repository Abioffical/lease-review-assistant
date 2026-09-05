import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReviewById } from "../api/api";
import StatusBadge from "../components/StatusBadge";
import FindingCard from "../components/FindingCard";
import "../styles/pages.css";

export default function ReviewDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getReviewById(id)
      .then(setData)
      .catch(() => setError("Could not load this review. It may have been deleted."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><p>Loading review...</p></div>;
  if (error) return <div className="page"><p className="form-error">{error}</p></div>;
  if (!data) return null;

  const { review, findings, summaryPoints } = data;

  const prohibited = findings.filter((f) => f.status === "prohibited_found");
  const deviations = findings.filter((f) => f.status === "deviation");
  const missing = findings.filter((f) => f.status === "missing");
  const matches = findings.filter((f) => f.status === "match");

  return (
    <div className="page">
      <div className="review-header">
        <div>
          <h1>{review.title}</h1>
          <p className="review-meta">
            Reviewed on {new Date(review.created_at).toLocaleString()} &middot; Source:{" "}
            {review.source_type === "file_upload" ? "Uploaded file" : "Pasted text"}
          </p>
        </div>
        <StatusBadge status={review.overall_status} />
      </div>

      <div className="counts-row">
        <div className="count-box count-match">{review.match_count} Matches</div>
        <div className="count-box count-deviation">{review.deviation_count} Deviations</div>
        <div className="count-box count-missing">{review.missing_count} Missing</div>
        <div className="count-box count-prohibited">{review.prohibited_count} Prohibited</div>
      </div>

      {review.overall_status === "clean" && (
        <div className="clean-banner">
          This agreement matches all company standards. No deviations, missing protections,
          or prohibited terms were found. It is still recommended for human sign-off.
        </div>
      )}

      <section className="report-section">
        <h2>Plain-Language Summary</h2>
        <p className="section-note">
          The terms a signer most needs to understand, in plain language.
        </p>
        <div className="summary-grid">
          {summaryPoints.map((s) => (
            <div key={s.id} className="summary-card">
              <h4>{s.heading}</h4>
              <p>{s.plain_explanation}</p>
              {s.quoted_clause && <blockquote className="quoted-clause small">"{s.quoted_clause}"</blockquote>}
            </div>
          ))}
        </div>
      </section>

      {prohibited.length > 0 && (
        <section className="report-section">
          <h2>Prohibited Terms Found</h2>
          <p className="section-note">Terms the company never accepts, quoted directly from the agreement.</p>
          {prohibited.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </section>
      )}

      {deviations.length > 0 && (
        <section className="report-section">
          <h2>Deviations From Standard</h2>
          <p className="section-note">Where the agreement addresses a topic but falls outside company policy.</p>
          {deviations.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </section>
      )}

      {missing.length > 0 && (
        <section className="report-section">
          <h2>Missing Required Protections</h2>
          <p className="section-note">
            Topics the agreement is silent on entirely. Silence is a finding, not a gap to skip.
          </p>
          {missing.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </section>
      )}

      {matches.length > 0 && (
        <section className="report-section">
          <h2>Matches</h2>
          <p className="section-note">Where the agreement matches the company's standard positions.</p>
          {matches.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </section>
      )}

      <p className="reviewer-disclaimer">
        This report flags and explains findings for a human legal reviewer. It does not
        approve or reject the agreement.
      </p>

      <Link to="/history" className="back-link">&larr; Back to History</Link>
    </div>
  );
}
