import axios from 'axios';

const isProduction = import.meta.env.PROD;
// Force relative URL in production for unified Vercel deployment, overriding any bad VITE_API_URL settings
const API_URL = isProduction ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

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
