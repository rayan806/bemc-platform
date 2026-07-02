/**
 * Archivo: client/src/api/client.js
 * Proposito: Cliente HTTP central (Axios) con JWT y manejo global de 401.
 */

import axios from 'axios';

// Configuracion base para hablar con la API.
const api = axios.create({
  // Si no se define URL externa, usa el mismo dominio en /api.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Toma el token guardado al iniciar sesion y lo envia en cada peticion.
  const token = localStorage.getItem('bemc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Si la sesion expiro (401), limpia datos locales y envia al login.
    if (err.response?.status === 401) {
      localStorage.removeItem('bemc_token');
      localStorage.removeItem('bemc_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
