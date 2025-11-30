import { useState } from "react";
import { Link } from "react-router-dom";

function UserMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="user-menu-container">
      {/* ICON USER */}
      <div className="user-icon" onClick={() => setOpen(!open)}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"></path>
        </svg>
      </div>

      {/* MENU */}
      {open && (
        <div className="user-dropdown">
          <Link to="/login" className="dropdown-item">
            🔐 Se connecter
          </Link>
          <Link to="/signup" className="dropdown-item">
            📝 S’inscrire
          </Link>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
