/**
 * Archivo: client/src/components/auth/AuthGlassCard.jsx
 * Proposito: Contenedor visual reutilizable para formularios de auth.
 */

import logo from '../../assets/bemc-logo.png';

export default function AuthGlassCard({ title, subtitle, wide, children }) {
  return (
    <div className={`auth-glass ${wide ? 'auth-glass--wide' : ''}`}>
      <img src={logo} alt="BEMC Soluciones SST" className="auth-logo" />
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
