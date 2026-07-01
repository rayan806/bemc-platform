import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (staffOnly && !isStaff) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
