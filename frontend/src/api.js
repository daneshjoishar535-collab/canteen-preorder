import axios from 'axios';

// All data comes from the REST API. Base URL is environment-based.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on expired/invalid token
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Turn an axios error into a readable message
export const errMsg = (err) => {
  // No HTTP response at all = server down, wrong VITE_API_URL, or blocked by CORS
  if (!err.response) {
    return `Cannot reach the API at ${api.defaults.baseURL}. Is the backend running and is VITE_API_URL correct?`;
  }
  const d = err.response?.data;
  if (d?.errors?.length) return `${d.message}: ${d.errors.join(', ')}`;
  return d?.message || err.message || 'Something went wrong';
};

export default api;
