import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Manage from './pages/Manage.jsx';
import './App.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path
              d="M7 3v7a2 2 0 0 0 2 2h1v9h2V3H9v7H8V3H7Zm9 0c-1.7 0-3 1.8-3 4v5h2v8h2V3h-1Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div>
          <p className="site-footer__name">Saffron &amp; Sage</p>
          <p className="site-footer__tagline">Fresh flavors, served with care.</p>
        </div>
      </div>
      <nav className="site-footer__links" aria-label="Footer">
        <Link to="/">Home</Link>
        <Link to="/menu">Menu</Link>
        <Link to="/manage">Manage</Link>
      </nav>
      <p className="site-footer__copy">
        &copy; {new Date().getFullYear()} Saffron &amp; Sage. All rights reserved.
      </p>
    </div>
  </footer>
);

const NotFound = () => (
  <section className="not-found">
    <p className="eyebrow">404</p>
    <h1>This table isn&apos;t set</h1>
    <p>The page you are looking for does not exist.</p>
    <Link className="btn btn--primary" to="/">
      Back to home
    </Link>
  </section>
);

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
