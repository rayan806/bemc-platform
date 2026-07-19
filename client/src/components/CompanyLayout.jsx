/**
 * Archivo: client/src/components/CompanyLayout.jsx
 * Proposito: Layout del panel de empresa para Marketplace SST.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';

const mainNavItems = [
  { to: '/empresa/servicios', label: 'Servicios de consultoria', icon: 'bi-clipboard2-check' },
  { to: '/empresa/crear-solicitud', label: 'Buscador de profesionales', icon: 'bi-search' },
];

const secondaryNavItems = [
  { to: '/empresa', label: 'Resumen', icon: 'bi-speedometer2', end: true },
  { to: '/empresa/solicitudes', label: 'Solicitudes', icon: 'bi-card-list' },
  { to: '/empresa/postulaciones', label: 'Postulaciones', icon: 'bi-people' },
  { to: '/empresa/historial', label: 'Historial', icon: 'bi-clock-history' },
];

export default function CompanyLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      <aside className="text-white p-3 d-flex flex-column" style={{ width: 260, background: 'var(--bemc-sidebar)', flexShrink: 0 }}>
        <div className="mb-4">
          <Link to="/" className="admin-brand text-white text-decoration-none fw-bold fs-5">
            <span>B.E.M.C.</span>
          </Link>
          <div className="small opacity-75">Panel de empresa</div>
        </div>
        <nav className="nav flex-column gap-2 flex-grow-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link rounded px-3 py-2 fw-semibold ${isActive ? 'bg-warning text-dark' : 'bg-white bg-opacity-10 text-white'}`}
            >
              <i className={`bi ${item.icon} me-2`} />
              {item.label}
            </NavLink>
          ))}

          <div className="small text-white-50 mt-2 mb-1 px-1">Gestion</div>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link text-white rounded px-3 py-2 ${isActive ? 'bg-white bg-opacity-25' : ''}`}
            >
              <i className={`bi ${item.icon} me-2`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-top border-white border-opacity-25 pt-3 mt-3 small">
          <div className="text-white-50">{user?.email}</div>
          <button type="button" className="btn btn-link text-white-50 p-0 mt-2 small" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <div className="flex-grow-1 d-flex flex-column">
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <h1 className="h5 mb-0 text-muted">Panel Empresa - Contrata rapido tu profesional SST</h1>
          <div className="d-flex align-items-center gap-2">
            <NotificationsMenu />
            <Link to="/" className="btn btn-outline-secondary btn-sm">Ver sitio público</Link>
          </div>
        </header>
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
