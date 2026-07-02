/**
 * Archivo: client/src/pages/ResetPasswordPage.jsx
 * Proposito: Actualizacion de contrasena usando token temporal.
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import AuthGlassCard from '../components/auth/AuthGlassCard';
import PasswordInput from '../components/auth/PasswordInput';

// Componente principal de esta vista.
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Enlace inválido o expirado');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', {
        state: { message: 'Contraseña actualizada. Inicia sesión.' },
        replace: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthGlassCard title="Enlace inválido">
        <div className="auth-alert auth-alert--error">
          Solicita un nuevo enlace desde recuperar contraseña.
        </div>
        <p className="auth-link-row">
          <Link to="/recuperar-contrasena">Recuperar contraseña</Link>
        </p>
      </AuthGlassCard>
    );
  }

  return (
    <AuthGlassCard
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura de al menos 6 caracteres."
    >
      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <PasswordInput
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="auth-field">
          <PasswordInput
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>

      <p className="auth-link-row">
        <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthGlassCard>
  );
}
