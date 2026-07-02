/**
 * Archivo: client/src/components/auth/SocialAuthButtons.jsx
 * Proposito: Botones para iniciar sesion con proveedores OAuth.
 */

import { useState } from 'react';
import api from '../../api/client';

// Componente principal de esta vista.
export default function SocialAuthButtons({ onError }) {
  const [loading, setLoading] = useState(null);

  const startOAuth = async (provider) => {
    setLoading(provider);
    onError?.('');
    try {
      const { data } = await api.get(`/auth/${provider}`);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      onError?.(
        err.response?.data?.message ||
          `${provider === 'facebook' ? 'Facebook' : 'Google'} no está configurado en el servidor.`
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="auth-shield-divider">
        <i className="bi bi-shield-check" aria-hidden />
      </div>
      <div className="auth-social-row">
        <button
          type="button"
          className="auth-social-btn auth-social-btn--google"
          title="Continuar con Google"
          disabled={!!loading}
          onClick={() => startOAuth('google')}
          aria-label="Continuar con Google"
        >
          <span className="auth-google-icon">G</span>
        </button>
        <button
          type="button"
          className="auth-social-btn auth-social-btn--facebook"
          title="Continuar con Facebook"
          disabled={!!loading}
          onClick={() => startOAuth('facebook')}
          aria-label="Continuar con Facebook"
        >
          <i className="bi bi-facebook" />
        </button>
      </div>
    </>
  );
}
