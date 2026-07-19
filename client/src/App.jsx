/**
 * Archivo: client/src/App.jsx
 * Proposito: Router principal de la app: rutas publicas, auth, portal y admin.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import AuthLayout from './components/auth/AuthLayout';
import AdminLayout from './components/AdminLayout';
import ClientLayout from './components/ClientLayout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PortalHome from './pages/portal/PortalHome';
import PortalServices from './pages/portal/PortalServices';
import PortalRequests from './pages/portal/PortalRequests';
import PortalMarketplace from './pages/portal/PortalMarketplace';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminClients from './pages/admin/AdminClients';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminPayments from './pages/admin/AdminPayments';
import AdminServices from './pages/admin/AdminServices';
import AdminMarketplace from './pages/admin/AdminMarketplace';

// Componente principal de esta vista.
export default function App() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
        <Route path="recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="restablecer-contrasena" element={<ResetPasswordPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
      </Route>

      {/* Public pages */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="servicios/:slug" element={<ServiceDetailPage />} />
      </Route>

      {/* Client portal routes */}
      <Route
        path="portal"
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PortalHome />} />
        <Route path="servicios" element={<PortalServices />} />
        <Route path="solicitudes" element={<PortalRequests />} />
        <Route path="marketplace" element={<PortalMarketplace />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="admin"
        element={
          <ProtectedRoute staffOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="solicitudes" element={<AdminRequests />} />
        <Route path="clientes" element={<AdminClients />} />
        <Route path="empresas" element={<AdminCompanies />} />
        <Route path="pagos" element={<AdminPayments />} />
        <Route path="servicios" element={<AdminServices />} />
        <Route path="marketplace" element={<AdminMarketplace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
