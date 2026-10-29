import { NavLink, Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path
                d="M7 3v7a2 2 0 0 0 2 2h1v9h2V3H9v7H8V3H7Zm9 0c-1.7 0-3 1.8-3 4v5h2v8h2V3h-1Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="header__brand-text">
            <span className="header__brand-name">Saffron &amp; Sage</span>
            <span className="header__brand-sub">Kitchen &amp; Grill</span>
          </span>
        </Link>

        <nav className="header__nav" aria-label="Main">
          <NavLink to="/" className="header__link" end>
            Home
          </NavLink>
          <NavLink to="/menu" className="header__link">
            Menu
          </NavLink>
          <NavLink to="/manage" className="header__link">
            Manage
          </NavLink>
          <Link to="/menu" className="btn btn--primary header__cta">
            Order now
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
