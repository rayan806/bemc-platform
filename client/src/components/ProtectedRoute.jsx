/**
 * Archivo: client/src/components/ProtectedRoute.jsx
 * Proposito: Guard de rutas privadas segun autenticacion y rol.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({
  children,
  staffOnly = false,
  allowRoles = null,
  allowAccountTypes = null,
  redirectTo = '/portal',
}) {
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

  if (Array.isArray(allowRoles) && allowRoles.length > 0 && !allowRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (
    Array.isArray(allowAccountTypes) &&
    allowAccountTypes.length > 0 &&
    !allowAccountTypes.includes(user.accountType)
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
