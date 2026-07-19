import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      <h2 className="h4 mb-4">Panel de empresa</h2>
      <p className="text-muted mb-4">Elige una opcion principal para avanzar rapido.</p>

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="card card-bemc p-3 h-100 border-0" style={{ background: 'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,255,255,0.9))' }}>
            <h3 className="h5 mb-2">Servicios de consultoria</h3>
            <p className="small text-muted mb-3">Consulta y gestiona los servicios tradicionales de B.E.M.C.</p>
            <div>
              <Link className="btn btn-outline-dark btn-sm" to="/empresa/servicios">Ir a servicios</Link>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card card-bemc p-3 h-100 border-0" style={{ background: 'linear-gradient(135deg, rgba(13,110,253,0.12), rgba(255,255,255,0.9))' }}>
            <h3 className="h5 mb-2">Buscador de profesionales</h3>
            <p className="small text-muted mb-3">Crea una solicitud corta y encuentra candidatos compatibles en minutos.</p>
            <div>
              <Link className="btn btn-bemc btn-sm" to="/empresa/crear-solicitud">Buscar profesionales</Link>
            </div>
          </div>
        </div>
      </div>

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
