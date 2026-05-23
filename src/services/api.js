import axios from 'axios';

// Prioritize VITE_API_URL if provided, otherwise fallback appropriately
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo && userInfo !== 'undefined') {
        const parsed = JSON.parse(userInfo);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (e) {
      console.error("Failed to parse userInfo in interceptor", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
