import StatusBadge from "./StatusBadge";
import "../styles/components.css";

export default function FindingCard({ finding }) {
  const { label, status, quoted_clause, explanation, severity } = finding;

  return (
    <div className={`finding-card finding-${status}`}>
      <div className="finding-header">
        <h4>{label}</h4>
        <div className="finding-badges">
          <StatusBadge status={status} />
          <span className={`severity-tag severity-${severity}`}>{severity}</span>
        </div>
      </div>

      {quoted_clause ? (
        <blockquote className="quoted-clause">"{quoted_clause}"</blockquote>
      ) : (
        <p className="no-clause-note">No matching clause found in the agreement.</p>
      )}

      <p className="finding-explanation">{explanation}</p>
    </div>
  );
}
