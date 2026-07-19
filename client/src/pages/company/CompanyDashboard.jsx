import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function CompanyDashboard() {
  const [data, setData] = useState({ requests: [], assignments: [], history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/marketplace/requests'),
      api.get('/marketplace/assignments'),
      api.get('/marketplace/history'),
    ])
      .then(([r1, r2, r3]) => setData({ requests: r1.data || [], assignments: r2.data || [], history: r3.data || [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-border text-primary" />;

  const activeServices = data.assignments.filter((a) => a.status === 'in_execution').length;
  const openRequests = data.requests.filter((r) => ['published', 'in_postulation'].includes(r.status)).length;
  const finished = data.history.length;
  const hiredProfessionals = new Set(data.assignments.map((a) => a.professional?._id).filter(Boolean)).size;

  return (
    <div>
      <h2 className="h4 mb-4">Dashboard Empresa</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="stat-card"><div className="stat-value">{activeServices}</div><div className="stat-label">Servicios activos</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-value">{openRequests}</div><div className="stat-label">Solicitudes abiertas</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-value">{finished}</div><div className="stat-label">Solicitudes finalizadas</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-value">{hiredProfessionals}</div><div className="stat-label">Profesionales contratados</div></div></div>
      </div>
      <div className="card card-bemc p-3">
        <h3 className="h6">Proximas actividades</h3>
        <ul className="mb-0">
          {data.assignments.slice(0, 5).map((a) => (
            <li key={a._id}>{a.request?.requiredProfessionalType || 'Servicio SST'} - {a.request?.city || 'Ciudad'} - {a.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
