/**
 * Archivo: client/src/components/PublicLayout.jsx
 * Proposito: Layout base para vistas publicas.
 */

import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/bemc-logo.png';

// Componente principal de esta vista.
export default function PublicLayout() {
  const { user, logout, isStaff } = useAuth();

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'var(--bemc-primary)' }}>
        <div className="container">
          <Link className="navbar-brand brand-link fw-bold" to="/">
            <img src={logo} alt="BEMC Soluciones SST" className="brand-logo brand-logo--nav" />
            <span>B.E.M.C.</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMain"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navMain">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/servicios">
                  Servicios SST
                </Link>
              </li>
            </ul>
            <ul className="navbar-nav">
              {user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to={isStaff ? '/admin' : '/portal'}>
                      Mi cuenta
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="nav-link btn btn-link" onClick={logout}>
                      Salir
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Iniciar sesión
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-accent btn-sm ms-2" to="/registro">
                      Registrarse
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <Outlet />
      <footer className="py-4 mt-5 border-top bg-white">
        <div className="container text-center text-muted small">
          © {new Date().getFullYear()} B.E.M.C. — Seguridad y Salud en el Trabajo
        </div>
      </footer>
    </>
  );
}
