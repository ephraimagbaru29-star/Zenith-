import axios from 'axios';

// In development, Vite proxies /api → http://localhost:5000 (see vite.config.js).
// In production, set VITE_API_URL to your deployed backend URL, e.g.:
//   https://your-backend.railway.app
// Leave it unset (or set to '') to keep using the /api proxy path.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zenith_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry globally — redirect to login on 401/403,
// but ONLY for protected routes (not the login endpoint itself).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (!isAuthRoute && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('zenith_token');
      localStorage.removeItem('zenith_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
