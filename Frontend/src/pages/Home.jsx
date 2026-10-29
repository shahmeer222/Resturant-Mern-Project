import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/menuService';
import { getApiErrorMessage, getImageUrl, FALLBACK_IMAGE } from '../services/api';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const { data } = await getCategories();

        if (cancelled) {
          return;
        }

        setCategories(Array.isArray(data?.data) ? data.data : []);
        setStatus('success');
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(getApiErrorMessage(err, 'Could not load categories right now.'));
        setStatus('error');
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setStatus('loading');
    setError('');
    setReloadKey((key) => key + 1);
  };

  const totalDishes = categories.reduce(
    (sum, category) => sum + (Number(category.foodCount) || 0),
    0,
  );

  const heroImage = categories[0]?.image;

  return (
    <div className="page">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="eyebrow">Welcome to Saffron &amp; Sage</span>
          <h1>Where every dish tells a story</h1>
          <p>
            Seasonal ingredients, slow-cooked classics and bold new flavors. Explore our
            menu and find your next favorite meal.
          </p>
          <div className="home-hero__actions">
            <Link className="btn btn--primary" to="/menu">
              Explore the menu
            </Link>
            <a className="btn btn--ghost" href="#categories">
              Browse categories
            </a>
          </div>
          <dl className="home-hero__stats">
            <div>
              <dt>Categories</dt>
              <dd>{status === 'success' ? categories.length : '—'}</dd>
            </div>
            <div>
              <dt>Dishes</dt>
              <dd>{status === 'success' ? totalDishes : '—'}</dd>
            </div>
            <div>
              <dt>Fresh daily</dt>
              <dd>100%</dd>
            </div>
          </dl>
        </div>

        <div className="home-hero__visual">
          <div className="hero-plate">
            <img
              src={getImageUrl(heroImage)}
              alt={categories[0]?.name || 'Signature dish'}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
          <div className="hero-note">
            <span className="hero-note__label">Chef&apos;s pick</span>
            <span className="hero-note__text">Made fresh, served warm</span>
          </div>
        </div>
      </section>

      <section id="categories" className="home-categories">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Our kitchen</span>
            <h2>Menu categories</h2>
          </div>
          <p>Pick a category to jump straight into the dishes you love.</p>
        </div>

        {status === 'loading' && (
          <div className="categories-grid" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="skeleton-card" key={index}>
                <div className="skeleton-card__image skeleton" />
                <div className="skeleton-card__body">
                  <div className="skeleton-line skeleton skeleton-line--medium" />
                  <div className="skeleton-line skeleton" />
                  <div className="skeleton-line skeleton skeleton-line--short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="state-card state-card--error">
            <h3>We couldn&apos;t load the categories</h3>
            <p>{error}</p>
            <button type="button" className="btn btn--primary" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {status === 'success' && categories.length === 0 && (
          <div className="state-card">
            <h3>No categories yet</h3>
            <p>Categories will appear here as soon as they are added to the menu.</p>
          </div>
        )}

        {status === 'success' && categories.length > 0 && (
          <div className="categories-grid">
            {categories.map((category) => (
              <Link
                to={`/menu?category=${category._id}`}
                key={category._id}
                className="category-card"
              >
                <div className="category-card__media">
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <span className="category-card__count">
                    {category.foodCount || 0} items
                  </span>
                </div>
                <div className="category-card__body">
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="category-card__link">
                    View dishes
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
