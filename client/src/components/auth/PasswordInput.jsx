/**
 * Archivo: client/src/components/auth/PasswordInput.jsx
 * Proposito: Input de password con accion mostrar/ocultar.
 */

import { useState } from 'react';

export default function PasswordInput({ placeholder, value, onChange, required, minLength, id }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-toggle">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="auth-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={placeholder?.includes('Confirmar') ? 'new-password' : 'current-password'}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} />
      </button>
    </div>
  );
}
