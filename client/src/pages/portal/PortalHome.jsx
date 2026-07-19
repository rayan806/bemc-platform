/**
 * Archivo: client/src/pages/portal/PortalHome.jsx
 * Proposito: Dashboard principal del cliente.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Componente principal de esta vista.
export default function PortalHome() {
  const { user } = useAuth();
  const showMarketplace = user?.role === 'professional_sst' || user?.accountType === 'company';

  return (
    <div>
      <h1 className="mb-2">
        Hola, {user?.profile?.firstName || 'Cliente'}
      </h1>
      <p className="text-muted mb-4">
        {user?.accountType === 'company' && user?.company
          ? `Empresa: ${user.company.legalName || 'registrada'}`
          : 'Cuenta personal'}
      </p>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card card-bemc p-4 h-100">
            <i className="bi bi-briefcase fs-2 text-primary mb-2" />
            <h2 className="h6">Contratar servicio</h2>
            <p className="small text-muted">Explora nuestros servicios SST</p>
            <Link to="/portal/servicios" className="btn btn-bemc btn-sm mt-auto align-self-start">
              Ver servicios
            </Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-bemc p-4 h-100">
            <i className="bi bi-inbox fs-2 text-primary mb-2" />
            <h2 className="h6">Mis solicitudes</h2>
            <p className="small text-muted">Estado, pagos y documentos</p>
            <Link to="/portal/solicitudes" className="btn btn-outline-primary btn-sm">
              Ver solicitudes
            </Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-bemc p-4 h-100">
            <i className="bi bi-file-earmark-arrow-up fs-2 text-primary mb-2" />
            <h2 className="h6">Documentos</h2>
            <p className="small text-muted">Próximamente: subir archivos por solicitud</p>
          </div>
        </div>
        {showMarketplace && (
          <div className="col-md-4">
            <div className="card card-bemc p-4 h-100">
              <i className="bi bi-diagram-3 fs-2 text-primary mb-2" />
              <h2 className="h6">Marketplace SST</h2>
              <p className="small text-muted">Publica vacantes o postúlate como profesional SST</p>
              <Link to="/portal/marketplace" className="btn btn-outline-primary btn-sm">
                Ir a marketplace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
