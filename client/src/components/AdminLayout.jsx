/**
 * Archivo: client/src/components/AdminLayout.jsx
 * Proposito: Layout base para el panel administrativo.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/bemc-logo.png';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/admin/solicitudes', label: 'Solicitudes', icon: 'bi-inbox' },
  { to: '/admin/clientes', label: 'Clientes', icon: 'bi-people' },
  { to: '/admin/empresas', label: 'Empresas', icon: 'bi-building' },
  { to: '/admin/pagos', label: 'Pagos', icon: 'bi-credit-card' },
  { to: '/admin/servicios', label: 'Servicios', icon: 'bi-briefcase' },
];

// Componente principal de esta vista.
export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="d-flex min-vh-100">
      <aside
        className="text-white p-3 d-flex flex-column"
        style={{ width: 260, background: 'var(--bemc-sidebar)', flexShrink: 0 }}
      >
        <div className="mb-4">
          <Link to="/" className="admin-brand text-white text-decoration-none fw-bold fs-5">
            <img src={logo} alt="BEMC Soluciones SST" className="brand-logo brand-logo--admin" />
            <span>B.E.M.C.</span>
          </Link>
          <div className="small opacity-75">Panel administrativo</div>
        </div>
        <nav className="nav flex-column gap-1 flex-grow-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link text-white rounded px-3 py-2 ${isActive ? 'bg-white bg-opacity-25' : ''}`
              }
            >
              <i className={`bi ${item.icon} me-2`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-top border-white border-opacity-25 pt-3 mt-3 small">
          <div className="text-white-50">{user?.email}</div>
          <div className="badge bg-light text-dark mt-1">{user?.role}</div>
          <button type="button" className="btn btn-link text-white-50 p-0 mt-2 small" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-grow-1 d-flex flex-column">
        <header className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <h1 className="h5 mb-0 text-muted">Administración</h1>
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-box-arrow-up-right me-1" />
            Ver sitio público
          </Link>
        </header>
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
