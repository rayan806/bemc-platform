/**
 * Archivo: client/src/components/ClientLayout.jsx
 * Proposito: Layout base para el portal del cliente autenticado.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ClientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-vh-100" style={{ background: 'var(--bemc-bg)' }}>
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold text-primary" to="/portal">
            B.E.M.C.
          </Link>
          <div className="d-flex align-items-center gap-3">
            <NavLink to="/portal" className="nav-link" end>
              Inicio
            </NavLink>
            <NavLink to="/portal/servicios" className="nav-link">
              Servicios
            </NavLink>
            <NavLink to="/portal/solicitudes" className="nav-link">
              Mis solicitudes
            </NavLink>
            <span className="text-muted small d-none d-md-inline">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </span>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  );
}
