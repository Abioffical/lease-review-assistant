import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getReviews, deleteReview } from "../api/api";
import StatusBadge from "../components/StatusBadge";
import "../styles/pages.css";

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadReviews() {
    setLoading(true);
    getReviews()
      .then(setReviews)
      .catch(() => setError("Could not load review history."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    await deleteReview(id);
    loadReviews();
  }

  if (loading) return <div className="page"><p>Loading history...</p></div>;

  return (
    <div className="page">
      <h1>Review History</h1>
      {error && <p className="form-error">{error}</p>}

      {reviews.length === 0 ? (
        <p className="empty-state">No reviews yet. Run your first review from the "New Review" tab.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Matches</th>
              <th>Deviations</th>
              <th>Missing</th>
              <th>Prohibited</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/reviews/${r.id}`} className="table-link">{r.title}</Link>
                </td>
                <td><StatusBadge status={r.overall_status} /></td>
                <td>{r.match_count}</td>
                <td>{r.deviation_count}</td>
                <td>{r.missing_count}</td>
                <td>{r.prohibited_count}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
