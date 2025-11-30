import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="notfound-page">
      <div className="card notfound-card">
        <div className="notfound-code">404</div>
        <p className="notfound-title">Page not found</p>
        <p className="notfound-text">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <Link to="/" className="notfound-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
