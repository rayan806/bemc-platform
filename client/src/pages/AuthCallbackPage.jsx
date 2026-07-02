/**
 * Archivo: client/src/pages/AuthCallbackPage.jsx
 * Proposito: Procesa callback OAuth y finaliza autenticacion.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthGlassCard from '../components/auth/AuthGlassCard';

const ERROR_MESSAGES = {
  access_denied: 'Cancelaste el inicio de sesión.',
  no_email:
    'No recibimos tu correo. Permite compartir el email o regístrate con correo y contraseña.',
  invalid_state: 'Sesión expirada. Intenta de nuevo.',
  oauth_failed: 'No se pudo completar el inicio de sesión.',
};

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromOAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(ERROR_MESSAGES[oauthError] || 'Error al iniciar sesión');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('Enlace inválido');
      return;
    }

    localStorage.setItem('bemc_token', token);

    api
      .get('/auth/me')
      .then((res) => {
        const user = res.data.user;
        localStorage.setItem('bemc_user', JSON.stringify(user));
        setUserFromOAuth(user);

        if (['admin', 'consultor', 'auxiliar', 'supervisor'].includes(user.role)) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/portal', { replace: true });
        }
      })
      .catch(() => {
        localStorage.removeItem('bemc_token');
        setError('No se pudo validar la sesión');
      });
  }, [searchParams, navigate, setUserFromOAuth]);

  if (error) {
    return (
      <AuthGlassCard title="Inicio de sesión">
        <div className="auth-alert auth-alert--error">{error}</div>
        <p className="auth-link-row">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </AuthGlassCard>
    );
  }

  return (
    <AuthGlassCard title="Iniciar Sesión">
      <div className="text-center py-4">
        <div className="spinner-border text-light" role="status" />
        <p className="auth-subtitle mt-3 mb-0">Completando inicio de sesión...</p>
      </div>
    </AuthGlassCard>
  );
}
