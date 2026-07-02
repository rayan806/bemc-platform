/**
 * Archivo: client/src/pages/admin/AdminServices.jsx
 * Proposito: Gestion/listado de servicios para admin.
 */

import { useEffect, useState } from 'react';
import api from '../../api/client';

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/services')
      .then((res) => setServices(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="h3 mb-4">Catálogo de servicios</h1>
      <p className="text-muted small mb-3">
        Los servicios iniciales se cargan al arrancar el servidor. La edición avanzada llegará en la siguiente iteración.
      </p>

      {loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="row g-3">
          {services.map((s) => (
            <div key={s._id} className="col-md-6">
              <div className="card card-bemc p-3">
                <div className="d-flex justify-content-between">
                  <h2 className="h6 mb-1">{s.name}</h2>
                  <span className="badge bg-light text-dark">{s.category}</span>
                </div>
                <p className="small text-muted mb-2">{s.shortDescription}</p>
                <strong className="text-primary">{formatPrice(s.price)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
