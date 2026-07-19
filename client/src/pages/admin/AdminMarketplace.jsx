/**
 * Archivo: client/src/pages/admin/AdminMarketplace.jsx
 * Proposito: Monitoreo administrativo del modulo Marketplace SST.
 */

import { useEffect, useState } from 'react';
import api from '../../api/client';

const requestStatuses = {
  draft: 'Borrador',
  published: 'Publicada',
  in_postulation: 'En postulacion',
  professional_selected: 'Profesional seleccionado',
  in_execution: 'En ejecucion',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
};

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AdminMarketplace() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/marketplace/requests'), api.get('/marketplace/assignments')])
      .then(([requestsRes, assignmentsRes]) => {
        setRequests(requestsRes.data || []);
        setAssignments(assignmentsRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar marketplace'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h1 className="h3 mb-4">Marketplace SST</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-value">{requests.length}</div>
            <div className="stat-label">Solicitudes marketplace</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-value">{assignments.length}</div>
            <div className="stat-label">Asignaciones</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-value">{requests.filter((r) => r.status === 'in_execution').length}</div>
            <div className="stat-label">Servicios en ejecucion</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-value">{requests.filter((r) => r.status === 'finished').length}</div>
            <div className="stat-label">Servicios finalizados</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Solicitudes recientes</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo requerido</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th>Inicio</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 20).map((r) => (
                <tr key={r._id}>
                  <td>{r.company?.legalName || 'Empresa'}</td>
                  <td>{r.requiredProfessionalType}</td>
                  <td>{r.city}</td>
                  <td>{requestStatuses[r.status] || r.status}</td>
                  <td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold">Asignaciones recientes</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Tipo de servicio</th>
                <th>Valor acordado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {assignments.slice(0, 20).map((a) => (
                <tr key={a._id}>
                  <td>
                    {a.professional?.profile?.firstName || 'Profesional'} {a.professional?.profile?.lastName || ''}
                  </td>
                  <td>{a.request?.requiredProfessionalType || 'SST'}</td>
                  <td>{formatMoney(a.agreedValue)}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
