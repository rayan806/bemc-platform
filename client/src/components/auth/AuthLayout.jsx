/**
 * Archivo: client/src/components/auth/AuthLayout.jsx
 * Proposito: Layout visual compartido para pantallas de autenticacion.
 */

import { Link, Outlet } from 'react-router-dom';
import '../../styles/auth.css';
import logo from '../../assets/bemc-logo.png';

// Componente principal de esta vista.
export default function AuthLayout() {
  return (
    <div className="auth-page">
      <Link to="/" className="auth-brand">
        <img src={logo} alt="BEMC Soluciones SST" className="auth-brand-logo" />
        <span>B.E.M.C.</span>
      </Link>
      <Outlet />
    </div>
  );
}
