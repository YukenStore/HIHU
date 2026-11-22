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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Jika token tidak valid / kedaluwarsa (401), hapus dari localStorage
    if (error.response && error.response.status === 401) {
      // Hanya hapus jika ada token tersimpan sebelumnya (menghindari redirect loop saat login gagal)
      const existingToken = localStorage.getItem('token');
      if (existingToken && !error.config.url.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
