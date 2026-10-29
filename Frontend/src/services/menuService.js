import axios from 'axios';
import { API_URL } from './api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const getCategories = (params = {}) => api.get('/api/categories', { params });
export const getCategoryById = (id) => api.get(`/api/categories/${id}`);
export const createCategory = (formData) =>
  api.post('/api/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateCategory = (id, formData) =>
  api.put(`/api/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

export const getFoods = (params = {}) => api.get('/api/foods', { params });
export const getFoodById = (id) => api.get(`/api/foods/${id}`);
export const createFood = (formData) =>
  api.post('/api/foods', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateFood = (id, formData) =>
  api.put(`/api/foods/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteFood = (id) => api.delete(`/api/foods/${id}`);

export default api;
