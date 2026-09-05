import { NavLink } from "react-router-dom";
import "../styles/components.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Lease Review Assistant</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          New Review
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          History
        </NavLink>
        <NavLink to="/standards" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Standards Playbook
        </NavLink>
      </div>
    </nav>
  );
}
