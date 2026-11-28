import axios from 'axios';

// Gunakan '/api' secara otomatis di Vercel (same-origin serverless function) dan localhost (Vite proxy),
// atau fallback ke VITE_API_BASE_URL / https://hihu-group.vercel.app/api jika diakses dari domain lain (misal GitHub Pages)
const isSameOriginApi =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('.vercel.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const BASE_URL = isSameOriginApi
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'https://hihu-group.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor untuk menyertakan token JWT pada setiap request
api.interceptors.request.use(
  (config) => {
    const rawToken = localStorage.getItem('token');
    const token = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (token && token !== 'GUEST_SIMULATION_TOKEN') {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk menangani error response secara global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika token tidak valid / kedaluwarsa / hilang (401), sinkronkan logout ke AuthContext & arahkan ke Login
    const reqUrl = String(error.config?.url || '');
    if (error.response && error.response.status === 401 && !reqUrl.includes('/login')) {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== 'GUEST_SIMULATION_TOKEN') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('tka_auth_expired'));
          window.location.hash = '#/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
