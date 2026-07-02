/**
 * Archivo: client/src/pages/ServicesPage.jsx
 * Proposito: Listado publico de servicios SST con filtros visuales.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { categoryLabels, getServicePresentation } from '../utils/servicePresentation';

// Componente principal de esta vista.
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/services')
      .then((res) => setServices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-2">Servicios SST</h1>
      <p className="text-muted mb-4">
        Soluciones en seguridad y salud en el trabajo para personas y empresas.
        Revisa la información de cada servicio y solicita una cotización personalizada.
      </p>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-4">
          {services.map((service) => {
            const visual = getServicePresentation(service);
            return (
              <div key={service._id} className="col-md-6 col-lg-4">
                <article className="card card-bemc h-100 overflow-hidden">
                  <div className={`service-image service-image--${visual.tone}`}>
                    <i className={`bi ${visual.icon}`} />
                    <span>{categoryLabels[service.category] || service.category}</span>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <span className="badge bg-light text-dark align-self-start mb-2">
                      {categoryLabels[service.category] || service.category}
                    </span>
                    <h2 className="h5 card-title">{service.name}</h2>
                    <p className="text-muted small flex-grow-1">
                      {service.description || service.shortDescription}
                    </p>
                    <div className="d-flex justify-content-between align-items-center gap-3 mt-auto">
                      <strong className="text-primary">Cotización personalizada</strong>
                      <Link to={`/servicios/${service.slug}`} className="btn btn-bemc btn-sm">
                        Ver más
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
