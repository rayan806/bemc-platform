import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import AuthGlassCard from '../components/auth/AuthGlassCard';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevToken(null);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });
      setSuccess(data.message);
      if (data.resetToken) {
        setDevToken(data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGlassCard
      title="Recuperar Contraseña"
      subtitle="Ingresa tu correo o número de teléfono. Te enviaremos instrucciones para crear una nueva contraseña."
    >
      {error && <div className="auth-alert auth-alert--error">{error}</div>}
      {success && <div className="auth-alert auth-alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <input
            type="text"
            className="auth-input"
            placeholder="Correo o número"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Enviando...' : 'Recuperar'}
        </button>
      </form>

      {devToken && (
        <p className="auth-link-row small">
          Modo desarrollo:{' '}
          <Link to={`/restablecer-contrasena?token=${devToken}`}>Restablecer ahora</Link>
        </p>
      )}

      <p className="auth-link-row">
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </AuthGlassCard>
  );
}
