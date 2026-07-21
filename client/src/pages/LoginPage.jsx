/**
 * Archivo: client/src/pages/LoginPage.jsx
 * Proposito: Formulario de inicio de sesion (local y social).
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthGlassCard from '../components/auth/AuthGlassCard';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';
import PasswordInput from '../components/auth/PasswordInput';

// Componente principal de esta vista.
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;
  const flash = location.state?.registered || location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (from) navigate(from);
      else if (['admin', 'consultor', 'auxiliar', 'supervisor'].includes(user.role)) {
        navigate('/admin');
      } else if (user.role === 'professional_sst') {
        navigate('/profesional');
      } else if (user.accountType === 'company') {
        navigate('/empresa');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Demasiados intentos de inicio de sesión. Espera unos minutos y vuelve a intentarlo.');
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGlassCard title="Iniciar Sesión">
      {flash && <div className="auth-alert auth-alert--success">{flash}</div>}
      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <input
            type="text"
            className="auth-input"
            placeholder="Correo o teléfono"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="auth-field">
          <PasswordInput
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="auth-forgot">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        </div>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <SocialAuthButtons onError={setError} />

      <p className="auth-link-row">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </AuthGlassCard>
  );
}
