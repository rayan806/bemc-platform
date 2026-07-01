import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const statusLabels = {
  draft: 'Borrador',
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PortalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/requests')
      .then((res) => setRequests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Mis solicitudes</h1>
        <Link to="/portal/servicios" className="btn btn-bemc btn-sm">
          Nueva solicitud
        </Link>
      </div>

      {loading ? (
        <div className="spinner-border text-primary" />
      ) : requests.length === 0 ? (
        <div className="card card-bemc p-5 text-center text-muted">
          No tienes solicitudes aún.{' '}
          <Link to="/portal/servicios">Contrata un servicio</Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded overflow-hidden">
            <thead className="table-light">
              <tr>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Valor</th>
                <th>Fecha</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.service?.name}</td>
                  <td>
                    <span className={`badge badge-status badge-${r.status}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td>{formatPrice(r.service?.price || 0)}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                  <td className="small text-muted">{r.clientNotes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
