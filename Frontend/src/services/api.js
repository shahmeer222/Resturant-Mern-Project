const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

export const API_URL = API_BASE_URL;
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;
export const FALLBACK_IMAGE = '/food-placeholder.svg';

export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_IMAGE;
  }

  if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('data:')) {
    return imagePath;
  }

  return `${API_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback;
