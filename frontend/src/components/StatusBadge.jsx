import "../styles/components.css";

const STATUS_CONFIG = {
  clean: { label: "Clean", className: "badge badge-clean" },
  needs_review: { label: "Needs Review", className: "badge badge-needs-review" },
  match: { label: "Match", className: "badge badge-match" },
  deviation: { label: "Deviation", className: "badge badge-deviation" },
  missing: { label: "Missing", className: "badge badge-missing" },
  prohibited_found: { label: "Prohibited Term Found", className: "badge badge-prohibited" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "badge" };
  return <span className={config.className}>{config.label}</span>;
}
