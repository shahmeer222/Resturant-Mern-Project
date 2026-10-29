import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createCategory,
  createFood,
  deleteCategory,
  deleteFood,
  getCategories,
  getFoods,
  updateCategory,
  updateFood,
} from '../services/menuService';
import { FALLBACK_IMAGE, getApiErrorMessage, getImageUrl } from '../services/api';
import './Manage.css';

const emptyCategory = { id: '', name: '', description: '' };
const emptyFood = { id: '', name: '', price: '', description: '', category: '' };

const readPreview = (file, setPreview) => {
  if (!file) {
    setPreview('');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    setPreview(typeof reader.result === 'string' ? reader.result : '');
  };
  reader.readAsDataURL(file);
};

const getFoodCategoryId = (food) => {
  const category = food?.category;
  if (category && typeof category === 'object') {
    return category._id || category.id || '';
  }
  return category || '';
};

const formatPrice = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `Rs ${amount.toLocaleString('en-PK')}` : '—';
};

const Manage = () => {
  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categoryFile, setCategoryFile] = useState(null);
  const [categoryPreview, setCategoryPreview] = useState('');
  const categoryFormRef = useRef(null);

  const [foodForm, setFoodForm] = useState(emptyFood);
  const [foodFile, setFoodFile] = useState(null);
  const [foodPreview, setFoodPreview] = useState('');
  const foodFormRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [categoriesResponse, foodsResponse] = await Promise.all([
          getCategories(),
          getFoods(),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(
          Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [],
        );
        setFoods(Array.isArray(foodsResponse.data?.data) ? foodsResponse.data.data : []);
        setStatus('success');
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(getApiErrorMessage(err, 'Could not load the menu data right now.'));
        setStatus('error');
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setReloadKey((key) => key + 1);
  };

  const retry = () => {
    setStatus('loading');
    setError('');
    refresh();
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategory);
    setCategoryFile(null);
    setCategoryPreview('');
    categoryFormRef.current?.reset();
  };

  const resetFoodForm = () => {
    setFoodForm(emptyFood);
    setFoodFile(null);
    setFoodPreview('');
    foodFormRef.current?.reset();
  };

  const startEditCategory = (category) => {
    setCategoryForm({
      id: category._id,
      name: category.name || '',
      description: category.description || '',
    });
    setCategoryFile(null);
    setCategoryPreview(category.image ? getImageUrl(category.image) : '');
    categoryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startEditFood = (food) => {
    setFoodForm({
      id: food._id,
      name: food.name || '',
      price: food.price ?? '',
      description: food.description || '',
      category: getFoodCategoryId(food),
    });
    setFoodFile(null);
    setFoodPreview(food.image ? getImageUrl(food.image) : '');
    foodFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitCategory = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const name = categoryForm.name.trim();
    const description = categoryForm.description.trim();

    if (!name || !description) {
      setNotice({ type: 'error', text: 'Category name and description are required.' });
      return;
    }

    if (!categoryForm.id && !categoryFile) {
      setNotice({ type: 'error', text: 'Please choose a category image.' });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);

    if (categoryFile) {
      formData.append('image', categoryFile);
    }

    setSubmitting(true);

    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, formData);
        setNotice({ type: 'success', text: 'Category updated successfully.' });
      } else {
        await createCategory(formData);
        setNotice({ type: 'success', text: 'Category added successfully.' });
      }

      resetCategoryForm();
      refresh();
    } catch (err) {
      setNotice({
        type: 'error',
        text: getApiErrorMessage(err, 'Could not save the category.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitFood = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const name = foodForm.name.trim();
    const description = foodForm.description.trim();
    const price = Number(foodForm.price);

    if (!name || !description || foodForm.price === '') {
      setNotice({ type: 'error', text: 'Food name, price and description are required.' });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setNotice({ type: 'error', text: 'Price must be a valid number of 0 or more.' });
      return;
    }

    if (!foodForm.category) {
      setNotice({ type: 'error', text: 'Please select a category.' });
      return;
    }

    if (!foodForm.id && !foodFile) {
      setNotice({ type: 'error', text: 'Please choose a food image.' });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', String(price));
    formData.append('description', description);
    formData.append('category', foodForm.category);

    if (foodFile) {
      formData.append('image', foodFile);
    }

    setSubmitting(true);

    try {
      if (foodForm.id) {
        await updateFood(foodForm.id, formData);
        setNotice({ type: 'success', text: 'Dish updated successfully.' });
      } else {
        await createFood(formData);
        setNotice({ type: 'success', text: 'Dish added successfully.' });
      }

      resetFoodForm();
      refresh();
    } catch (err) {
      setNotice({
        type: 'error',
        text: getApiErrorMessage(err, 'Could not save the dish.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeCategory = async (category) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? All dishes inside this category will also be deleted.`,
      )
    ) {
      return;
    }

    setDeletingId(category._id);

    try {
      await deleteCategory(category._id);
      setNotice({ type: 'success', text: 'Category deleted.' });

      if (categoryForm.id === category._id) {
        resetCategoryForm();
      }

      if (getFoodCategoryId(foodForm) === category._id) {
        setFoodForm((current) => ({ ...current, category: '' }));
      }

      refresh();
    } catch (err) {
      setNotice({
        type: 'error',
        text: getApiErrorMessage(err, 'Could not delete the category.'),
      });
    } finally {
      setDeletingId('');
    }
  };

  const removeFood = async (food) => {
    if (!window.confirm(`Delete "${food.name}"?`)) {
      return;
    }

    setDeletingId(food._id);

    try {
      await deleteFood(food._id);
      setNotice({ type: 'success', text: 'Dish deleted.' });

      if (foodForm.id === food._id) {
        resetFoodForm();
      }

      refresh();
    } catch (err) {
      setNotice({
        type: 'error',
        text: getApiErrorMessage(err, 'Could not delete the dish.'),
      });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="page manage-page">
      <header className="manage-heading">
        <div>
          <span className="eyebrow">Admin panel</span>
          <h1>Manage menu</h1>
          <p>Add, edit and remove categories and dishes. Changes appear instantly on the menu.</p>
        </div>
        <Link to="/menu" className="btn btn--ghost">
          View menu
        </Link>
      </header>

      {notice && (
        <div className={`notice notice--${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button
            type="button"
            className="notice__close"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <div className="manage-tabs">
        <button
          type="button"
          className={`manage-tab${tab === 'categories' ? ' is-active' : ''}`}
          aria-pressed={tab === 'categories'}
          onClick={() => setTab('categories')}
        >
          Categories <span>{categories.length}</span>
        </button>
        <button
          type="button"
          className={`manage-tab${tab === 'foods' ? ' is-active' : ''}`}
          aria-pressed={tab === 'foods'}
          onClick={() => setTab('foods')}
        >
          Dishes <span>{foods.length}</span>
        </button>
      </div>

      {status === 'loading' && (
        <div className="state-card">
          <p>Loading menu data...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="state-card state-card--error">
          <h3>We couldn&apos;t load the menu data</h3>
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === 'success' && tab === 'categories' && (
        <div className="manage-layout">
          <form className="manage-form" ref={categoryFormRef} onSubmit={submitCategory}>
            <div className="manage-form__head">
              <h2>{categoryForm.id ? 'Edit category' : 'Add category'}</h2>
              <p>Group related dishes under one category.</p>
            </div>

            <label className="field">
              <span>Category name</span>
              <input
                type="text"
                value={categoryForm.name}
                maxLength={100}
                placeholder="e.g. Fast Food"
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={categoryForm.description}
                rows={3}
                maxLength={1000}
                placeholder="Short description of this category"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </label>

            <div className="field">
              <span>Category image{categoryForm.id ? ' (optional)' : ''}</span>
              <div className="upload">
                <img src={categoryPreview || FALLBACK_IMAGE} alt="" />
                <div className="upload__meta">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setCategoryFile(file);
                      readPreview(file, setCategoryPreview);
                    }}
                  />
                  <small>JPG, PNG, WEBP or GIF up to 5 MB.</small>
                </div>
              </div>
            </div>

            <div className="manage-form__actions">
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting
                  ? 'Saving...'
                  : categoryForm.id
                    ? 'Update category'
                    : 'Add category'}
              </button>
              {categoryForm.id && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetCategoryForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="manage-list">
            <div className="manage-list__head">
              <h2>All categories</h2>
              <span>{categories.length} total</span>
            </div>

            {categories.length === 0 ? (
              <div className="state-card">
                <h3>No categories yet</h3>
                <p>Use the form to add your first category.</p>
              </div>
            ) : (
              <ul className="manage-rows">
                {categories.map((category) => (
                  <li className="manage-row" key={category._id}>
                    <img
                      className="manage-row__image"
                      src={getImageUrl(category.image)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="manage-row__body">
                      <div className="manage-row__title">
                        <h3>{category.name}</h3>
                        <span className="manage-row__tag">
                          {category.foodCount || 0} dishes
                        </span>
                      </div>
                      <p>{category.description}</p>
                    </div>
                    <div className="manage-row__actions">
                      <button
                        type="button"
                        className="btn btn--small btn--ghost"
                        onClick={() => startEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--small btn--danger"
                        onClick={() => removeCategory(category)}
                        disabled={deletingId === category._id}
                      >
                        {deletingId === category._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {status === 'success' && tab === 'foods' && (
        <div className="manage-layout">
          <form className="manage-form" ref={foodFormRef} onSubmit={submitFood}>
            <div className="manage-form__head">
              <h2>{foodForm.id ? 'Edit dish' : 'Add dish'}</h2>
              <p>Add a dish to any category with its price and image.</p>
            </div>

            {categories.length === 0 && (
              <p className="manage-form__hint">
                Add a category first, then you can add dishes to it.
              </p>
            )}

            <label className="field">
              <span>Dish name</span>
              <input
                type="text"
                value={foodForm.name}
                maxLength={100}
                placeholder="e.g. Zinger Burger"
                onChange={(event) =>
                  setFoodForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Price (Rs)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={foodForm.price}
                  placeholder="0"
                  onChange={(event) =>
                    setFoodForm((current) => ({ ...current, price: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  value={foodForm.category}
                  onChange={(event) =>
                    setFoodForm((current) => ({ ...current, category: event.target.value }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                value={foodForm.description}
                rows={3}
                maxLength={1000}
                placeholder="What makes this dish special?"
                onChange={(event) =>
                  setFoodForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                required
              />
            </label>

            <div className="field">
              <span>Dish image{foodForm.id ? ' (optional)' : ''}</span>
              <div className="upload">
                <img src={foodPreview || FALLBACK_IMAGE} alt="" />
                <div className="upload__meta">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setFoodFile(file);
                      readPreview(file, setFoodPreview);
                    }}
                  />
                  <small>JPG, PNG, WEBP or GIF up to 5 MB.</small>
                </div>
              </div>
            </div>

            <div className="manage-form__actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting || categories.length === 0}
              >
                {submitting ? 'Saving...' : foodForm.id ? 'Update dish' : 'Add dish'}
              </button>
              {foodForm.id && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetFoodForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="manage-list">
            <div className="manage-list__head">
              <h2>All dishes</h2>
              <span>{foods.length} total</span>
            </div>

            {foods.length === 0 ? (
              <div className="state-card">
                <h3>No dishes yet</h3>
                <p>Use the form to add your first dish.</p>
              </div>
            ) : (
              <ul className="manage-rows">
                {foods.map((food) => (
                  <li className="manage-row" key={food._id}>
                    <img
                      className="manage-row__image"
                      src={getImageUrl(food.image)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="manage-row__body">
                      <div className="manage-row__title">
                        <h3>{food.name}</h3>
                        <span className="manage-row__tag">{formatPrice(food.price)}</span>
                      </div>
                      <p>{food.description}</p>
                      <span className="manage-row__category">
                        {typeof food.category === 'object'
                          ? food.category?.name
                          : categories.find((item) => item._id === food.category)?.name ||
                            'Uncategorized'}
                      </span>
                    </div>
                    <div className="manage-row__actions">
                      <button
                        type="button"
                        className="btn btn--small btn--ghost"
                        onClick={() => startEditFood(food)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--small btn--danger"
                        onClick={() => removeFood(food)}
                        disabled={deletingId === food._id}
                      >
                        {deletingId === food._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Manage;
