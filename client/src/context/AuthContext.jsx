/**
 * Archivo: client/src/context/AuthContext.jsx
 * Proposito: Estado global de autenticacion y acciones de sesion del usuario.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const STAFF_ROLES = ['admin', 'consultor', 'auxiliar', 'supervisor'];
const PROFESSIONAL_ROLE = 'professional_sst';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Recupera sesion previa guardada en el navegador.
      return JSON.parse(localStorage.getItem('bemc_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bemc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Valida token consultando al backend quien es el usuario actual.
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('bemc_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('bemc_token');
        localStorage.removeItem('bemc_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    // Inicia sesion con email/telefono + contrasena.
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('bemc_token', data.token);
    localStorage.setItem('bemc_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    // Crea cuenta nueva y deja la sesion activa.
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('bemc_token', data.token);
    localStorage.setItem('bemc_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    // Cierra sesion local en el navegador.
    localStorage.removeItem('bemc_token');
    localStorage.removeItem('bemc_user');
    setUser(null);
  };

  const setUserFromOAuth = (userData) => {
    setUser(userData);
  };

  const isStaff = user && STAFF_ROLES.includes(user.role);
  const isAdmin = user?.role === 'admin';
  const isProfessional = user?.role === PROFESSIONAL_ROLE;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUserFromOAuth,
        isStaff,
        isAdmin,
        isProfessional,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
