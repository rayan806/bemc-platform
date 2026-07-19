/**
 * Archivo: client/src/components/ProfessionalLayout.jsx
 * Proposito: Layout del panel profesional SST.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';

const navItems = [
  { to: '/profesional', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/profesional/perfil', label: 'Mi perfil', icon: 'bi-person-badge' },
  { to: '/profesional/documentos', label: 'Mis documentos', icon: 'bi-folder2-open' },
  { to: '/profesional/certificaciones', label: 'Mis certificaciones', icon: 'bi-patch-check' },
  { to: '/profesional/solicitudes', label: 'Solicitudes disponibles', icon: 'bi-briefcase' },
  { to: '/profesional/postulaciones', label: 'Mis postulaciones', icon: 'bi-send-check' },
  { to: '/profesional/servicios', label: 'Mis servicios', icon: 'bi-clipboard2-pulse' },
  { to: '/profesional/calendario', label: 'Calendario', icon: 'bi-calendar-event' },
  { to: '/profesional/notificaciones', label: 'Notificaciones', icon: 'bi-bell' },
  { to: '/profesional/configuracion', label: 'Configuracion', icon: 'bi-gear' },
  { to: '/profesional/historial', label: 'Historial', icon: 'bi-clock-history' },
];

export default function ProfessionalLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      <aside className="text-white p-3 d-flex flex-column" style={{ width: 280, background: 'var(--bemc-sidebar)', flexShrink: 0 }}>
        <div className="mb-4">
          <Link to="/" className="admin-brand text-white text-decoration-none fw-bold fs-5">
            <span>B.E.M.C.</span>
          </Link>
          <div className="small opacity-75">Panel profesional SST</div>
        </div>
        <nav className="nav flex-column gap-1 flex-grow-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link text-white rounded px-3 py-2 ${isActive ? 'bg-white bg-opacity-25' : ''}`}>
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
          <h1 className="h5 mb-0 text-muted">Profesional SST</h1>
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
