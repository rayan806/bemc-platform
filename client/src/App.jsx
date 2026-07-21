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
import CompanyLayout from './components/CompanyLayout';
import ProfessionalLayout from './components/ProfessionalLayout';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import PublicCompanyQuotePage from './pages/PublicCompanyQuotePage';
import PublicProfessionalPage from './pages/PublicProfessionalPage';
import PublicProfessionalProfilePage from './pages/PublicProfessionalProfilePage';
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
import AdminProfessionals from './pages/admin/AdminProfessionals';
import AdminControlCenter from './pages/admin/AdminControlCenter';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminStats from './pages/admin/AdminStats';
import AdminSettings from './pages/admin/AdminSettings';
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyCreateRequest from './pages/company/CompanyCreateRequest';
import CompanyRequests from './pages/company/CompanyRequests';
import CompanyApplications from './pages/company/CompanyApplications';
import CompanyServices from './pages/company/CompanyServices';
import CompanyHistory from './pages/company/CompanyHistory';
import CompanyProfessionalSearch from './pages/company/CompanyProfessionalSearch';
import ProfessionalDashboard from './pages/professional/ProfessionalDashboard';
import ProfessionalProfile from './pages/professional/ProfessionalProfile';
import ProfessionalOpportunities from './pages/professional/ProfessionalOpportunities';
import ProfessionalApplications from './pages/professional/ProfessionalApplications';
import ProfessionalServices from './pages/professional/ProfessionalServices';
import ProfessionalHistory from './pages/professional/ProfessionalHistory';
import ProfessionalDocuments from './pages/professional/ProfessionalDocuments';
import ProfessionalCertifications from './pages/professional/ProfessionalCertifications';
import ProfessionalCalendar from './pages/professional/ProfessionalCalendar';
import ProfessionalNotifications from './pages/professional/ProfessionalNotifications';
import ProfessionalSettings from './pages/professional/ProfessionalSettings';

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
        <Route path="cotizacion-empresas" element={<PublicCompanyQuotePage />} />
        <Route path="profesionales-sst" element={<PublicProfessionalPage />} />
        <Route path="profesionales-sst/:id" element={<PublicProfessionalProfilePage />} />
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
        path="empresa"
        element={
          <ProtectedRoute allowAccountTypes={['company']} redirectTo="/portal">
            <CompanyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CompanyDashboard />} />
        <Route path="crear-solicitud" element={<CompanyCreateRequest />} />
        <Route path="buscar-profesionales" element={<CompanyProfessionalSearch />} />
        <Route path="solicitudes" element={<CompanyRequests />} />
        <Route path="postulaciones" element={<CompanyApplications />} />
        <Route path="servicios" element={<CompanyServices />} />
        <Route path="historial" element={<CompanyHistory />} />
      </Route>

      <Route
        path="profesional"
        element={
          <ProtectedRoute allowRoles={['professional_sst']} redirectTo="/portal">
            <ProfessionalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfessionalDashboard />} />
        <Route path="perfil" element={<ProfessionalProfile />} />
        <Route path="documentos" element={<ProfessionalDocuments />} />
        <Route path="certificaciones" element={<ProfessionalCertifications />} />
        <Route path="solicitudes" element={<ProfessionalOpportunities />} />
        <Route path="postulaciones" element={<ProfessionalApplications />} />
        <Route path="servicios" element={<ProfessionalServices />} />
        <Route path="calendario" element={<ProfessionalCalendar />} />
        <Route path="notificaciones" element={<ProfessionalNotifications />} />
        <Route path="configuracion" element={<ProfessionalSettings />} />
        <Route path="historial" element={<ProfessionalHistory />} />
      </Route>

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
        <Route path="profesionales" element={<AdminProfessionals />} />
        <Route path="pagos" element={<AdminPayments />} />
        <Route path="servicios" element={<AdminServices />} />
        <Route path="marketplace" element={<AdminMarketplace />} />
        <Route path="documentos" element={<AdminDocuments />} />
        <Route path="estadisticas" element={<AdminStats />} />
        <Route path="configuracion" element={<AdminSettings />} />
        <Route path="control" element={<AdminControlCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
