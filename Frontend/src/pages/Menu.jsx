import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCategories, getFoods } from '../services/menuService';
import { getApiErrorMessage, getImageUrl, FALLBACK_IMAGE } from '../services/api';
import './Menu.css';

const getCategoryId = (food) => {
  const category = food?.category;
  if (category && typeof category === 'object') {
    return category._id || category.id || '';
  }
  return category || '';
};

const getCategoryName = (food, categories) => {
  const category = food?.category;

  if (category && typeof category === 'object' && category.name) {
    return category.name;
  }

  const match = categories.find((item) => item._id === category);
  return match?.name || 'Uncategorized';
};

const formatPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  return `Rs ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
};

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get('category') || '',
  );

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      try {
        const [foodsResponse, categoriesResponse] = await Promise.all([
          getFoods(),
          getCategories(),
        ]);

        if (cancelled) {
          return;
        }

        setFoods(Array.isArray(foodsResponse.data?.data) ? foodsResponse.data.data : []);
        setCategories(
          Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [],
        );
        setStatus('success');
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(getApiErrorMessage(err, 'Could not load the menu right now.'));
        setStatus('error');
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setStatus('loading');
    setError('');
    setReloadKey((key) => key + 1);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    const query = searchTerm.trim();

    if (selectedCategory) {
      params.set('category', selectedCategory);
    }

    if (query) {
      params.set('q', query);
    }

    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchTerm, setSearchParams]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();

    foods.forEach((food) => {
      const id = getCategoryId(food);
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return counts;
  }, [foods]);

  const filteredFoods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return foods.filter((food) => {
      if (selectedCategory && getCategoryId(food) !== selectedCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const categoryName = getCategoryName(food, categories).toLowerCase();

      return [food.name, food.description, categoryName].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      );
    });
  }, [foods, categories, selectedCategory, searchTerm]);

  const hasFilters = Boolean(searchTerm.trim() || selectedCategory);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  return (
    <div className="page menu-page">
      <header className="menu-heading">
        <Link to="/" className="menu-heading__back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19 12H5m6-6-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to home
        </Link>
        <span className="eyebrow">Fresh from the kitchen</span>
        <h1>Our menu</h1>
        <p>
          Browse every dish on the menu, filter by category or search for exactly what
          you are craving.
        </p>
      </header>

      <div className="menu-toolbar">
        <div className="menu-search">
          <svg className="menu-search__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="11"
              cy="11"
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m20 20-3.2-3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search dishes, ingredients..."
            aria-label="Search dishes"
          />
          {searchTerm && (
            <button
              type="button"
              className="menu-search__clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {status === 'success' && (
          <p className="menu-results">
            Showing <strong>{filteredFoods.length}</strong> of {foods.length} dishes
          </p>
        )}
      </div>

      {status === 'success' && categories.length > 0 && (
        <div className="menu-filters" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`menu-chip${selectedCategory === '' ? ' is-active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
            <span>{foods.length}</span>
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category._id}
              className={`menu-chip${
                selectedCategory === category._id ? ' is-active' : ''
              }`}
              onClick={() => setSelectedCategory(category._id)}
            >
              {category.name}
              <span>{categoryCounts.get(category._id) || 0}</span>
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && (
        <div className="foods-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
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
          <h3>We couldn&apos;t load the menu</h3>
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === 'success' && filteredFoods.length === 0 && (
        <div className="state-card">
          <h3>{hasFilters ? 'No dishes match your filters' : 'No dishes yet'}</h3>
          <p>
            {hasFilters
              ? 'Try a different search term or choose another category.'
              : 'Dishes will appear here as soon as they are added to the menu.'}
          </p>
          {hasFilters && (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {status === 'success' && filteredFoods.length > 0 && (
        <div className="foods-grid">
          {filteredFoods.map((food) => (
            <article className="food-card" key={food._id}>
              <div className="food-card__media">
                <img
                  src={getImageUrl(food.image)}
                  alt={food.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <span className="food-card__badge">
                  {getCategoryName(food, categories)}
                </span>
              </div>
              <div className="food-card__body">
                <div className="food-card__row">
                  <h3>{food.name}</h3>
                  <span className="food-card__price">{formatPrice(food.price)}</span>
                </div>
                <p>{food.description}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
