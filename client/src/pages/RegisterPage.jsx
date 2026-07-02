/**
 * Archivo: client/src/pages/RegisterPage.jsx
 * Proposito: Formulario de registro para persona o empresa.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthGlassCard from '../components/auth/AuthGlassCard';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';
import PasswordInput from '../components/auth/PasswordInput';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('person');
  const [form, setForm] = useState({
    firstName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    legalName: '',
    nit: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    if (accountType === 'company' && (!form.legalName || !form.nit)) {
      setError('Para empresa necesitas razón social y NIT');
      return;
    }

    setLoading(true);

    const payload = {
      email: form.email.trim(),
      password: form.password,
      accountType,
      firstName: form.firstName.trim() || form.email.split('@')[0],
      phone: form.phone.trim(),
    };

    if (accountType === 'company') {
      payload.company = {
        legalName: form.legalName.trim(),
        nit: form.nit.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        legalRepresentative: form.firstName.trim(),
      };
    }

    try {
      await register(payload);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGlassCard title="Registrarse" wide>
      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`auth-tab ${accountType === 'person' ? 'active' : ''}`}
          onClick={() => setAccountType('person')}
        >
          Persona
        </button>
        <button
          type="button"
          role="tab"
          className={`auth-tab ${accountType === 'company' ? 'active' : ''}`}
          onClick={() => setAccountType('company')}
        >
          Empresa
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <input
            className="auth-input"
            placeholder="Nombre completo"
            value={form.firstName}
            onChange={update('firstName')}
            required
            autoComplete="name"
          />
        </div>
        <div className="auth-field">
          <input
            type="email"
            className="auth-input"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={update('email')}
            required
            autoComplete="email"
          />
        </div>
        <div className="auth-field">
          <input
            type="tel"
            className="auth-input"
            placeholder="Teléfono (opcional)"
            value={form.phone}
            onChange={update('phone')}
            autoComplete="tel"
          />
        </div>
        <div className="auth-field">
          <PasswordInput
            placeholder="Contraseña"
            value={form.password}
            onChange={update('password')}
            required
            minLength={6}
          />
        </div>
        <div className="auth-field">
          <PasswordInput
            placeholder="Confirmar contraseña"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            required
            minLength={6}
          />
        </div>

        {accountType === 'company' && (
          <div className="auth-expand">
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Razón social"
                value={form.legalName}
                onChange={update('legalName')}
                required
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="NIT"
                value={form.nit}
                onChange={update('nit')}
                required
              />
            </div>
          </div>
        )}

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>

      <SocialAuthButtons onError={setError} />

      <p className="auth-link-row">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthGlassCard>
  );
}
