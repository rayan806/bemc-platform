/**
 * Archivo: client/src/components/ProtectedRoute.jsx
 * Proposito: Guard de rutas privadas segun autenticacion y rol.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading, isStaff } = useAuth();

  // Mientras valida sesion, muestra un cargando.
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  // Si no hay sesion, envia al login.
  if (!user) return <Navigate to="/login" replace />;

  // Si la ruta es solo para staff, bloquea a clientes normales.
  if (staffOnly && !isStaff) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
