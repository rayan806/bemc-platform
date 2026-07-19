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

// Componente principal de esta vista.
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
    mainProfession: '',
    yearsExperience: 0,
    licenseNumber: '',
    licenseExpiryDate: '',
    avatarUrl: '',
    experienceSummary: '',
    city: '',
    specialties: '',
    serviceCities: '',
    studiesText: '',
    licensesText: '',
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
    if (accountType === 'professional' && !form.mainProfession.trim()) {
      setError('Para profesional SST indica tu profesion principal');
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

    if (accountType === 'professional') {
      payload.mainProfession = form.mainProfession.trim();
      payload.mainRole = form.mainProfession.trim();
      payload.yearsExperience = Number(form.yearsExperience || 0);
      payload.experienceSummary = form.experienceSummary.trim();
      payload.licenseNumber = form.licenseNumber.trim();
      payload.licenseExpiryDate = form.licenseExpiryDate || undefined;
      payload.avatarUrl = form.avatarUrl.trim();
      payload.city = form.city.trim();
      payload.specialties = form.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      payload.serviceMunicipalities = form.serviceCities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      payload.studies = form.studiesText
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => {
          const [title = '', institution = '', year = ''] = row.split('|').map((v) => v.trim());
          return { title, institution, year: year ? Number(year) : undefined };
        })
        .filter((s) => s.title);
      payload.licenses = form.licensesText
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean)
        .map((row) => {
          const [name = '', number = '', expiryDate = ''] = row.split('|').map((v) => v.trim());
          return { name, number, expiryDate: expiryDate || undefined };
        })
        .filter((l) => l.name || l.number);
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
        <button
          type="button"
          role="tab"
          className={`auth-tab ${accountType === 'professional' ? 'active' : ''}`}
          onClick={() => setAccountType('professional')}
        >
          Profesional SST
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

        {accountType === 'professional' && (
          <div className="auth-expand">
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Profesion principal (ej. Profesional SST)"
                value={form.mainProfession}
                onChange={update('mainProfession')}
                required
              />
            </div>
            <div className="auth-field">
              <input
                type="number"
                min="0"
                className="auth-input"
                placeholder="Años de experiencia"
                value={form.yearsExperience}
                onChange={update('yearsExperience')}
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Numero de licencia (opcional)"
                value={form.licenseNumber}
                onChange={update('licenseNumber')}
              />
            </div>
            <div className="auth-field">
              <input
                type="date"
                className="auth-input"
                placeholder="Vencimiento licencia"
                value={form.licenseExpiryDate}
                onChange={update('licenseExpiryDate')}
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="URL de foto de perfil"
                value={form.avatarUrl}
                onChange={update('avatarUrl')}
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Ciudad base"
                value={form.city}
                onChange={update('city')}
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Ciudades donde presta servicio (coma)"
                value={form.serviceCities}
                onChange={update('serviceCities')}
              />
            </div>
            <div className="auth-field">
              <input
                className="auth-input"
                placeholder="Especialidades (separadas por coma)"
                value={form.specialties}
                onChange={update('specialties')}
              />
            </div>
            <div className="auth-field">
              <textarea
                className="auth-input"
                placeholder="Resumen de experiencia"
                value={form.experienceSummary}
                onChange={update('experienceSummary')}
              />
            </div>
            <div className="auth-field">
              <textarea
                className="auth-input"
                placeholder="Estudios (linea: titulo|institucion|anio)"
                value={form.studiesText}
                onChange={update('studiesText')}
              />
            </div>
            <div className="auth-field">
              <textarea
                className="auth-input"
                placeholder="Licencias adicionales (linea: nombre|numero|fecha_yyyy-mm-dd)"
                value={form.licensesText}
                onChange={update('licensesText')}
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
