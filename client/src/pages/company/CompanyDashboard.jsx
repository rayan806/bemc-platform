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
  const managementPercent = data.assignments.length
    ? Math.round((activeServices / data.assignments.length) * 100)
    : 0;
  const upcomingAssignments = data.assignments
    .filter((assignment) => !['finished', 'cancelled'].includes(assignment.status))
    .slice(0, 5);
  const stats = [
    ['Servicios activos', activeServices, 'bi-briefcase', '#2589d8'],
    ['Solicitudes abiertas', openRequests, 'bi-clipboard2', '#1ca56f'],
    ['Postulaciones recibidas', data.requests.reduce((total, request) => total + (request.applicationCount || 0), 0), 'bi-people', '#7652d8'],
    ['Profesionales contratados', hiredProfessionals, 'bi-person-check', '#f28b24'],
  ];

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading">
        <div><h2>Dashboard Empresa</h2><p>Resumen de tu gestión SST y servicios contratados.</p></div>
        <div className="dashboard-date"><i className="bi bi-calendar3" /> Actividad reciente <i className="bi bi-chevron-down" /></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="dashboard-panel p-3 h-100">
            <h3 className="h5 mb-2">Servicios de consultoria</h3>
            <p className="small text-muted mb-3">Consulta y gestiona los servicios tradicionales de B.E.M.C.</p>
            <div>
              <Link className="btn btn-outline-dark btn-sm" to="/empresa/servicios">Ir a servicios</Link>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="dashboard-panel p-3 h-100">
            <h3 className="h5 mb-2">Buscador de profesionales</h3>
            <p className="small text-muted mb-3">Crea una solicitud corta y encuentra candidatos compatibles en minutos.</p>
            <div>
              <Link className="btn btn-bemc btn-sm" to="/empresa/crear-solicitud">Buscar profesionales</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {stats.map(([label, value, icon, color]) => <div key={label} className="col-6 col-md-3"><div className="dashboard-stat"><div className="dashboard-stat__top"><span className="dashboard-stat__icon" style={{ background: color }}><i className={`bi ${icon}`} /></span></div><div className="dashboard-stat__value">{value}</div><div className="dashboard-stat__label">{label}</div></div></div>)}
      </div>
      <div className="row g-3">
        <div className="col-lg-6"><div className="dashboard-panel"><div className="dashboard-panel__header"><h3>Próximas actividades</h3><Link to="/empresa/historial">Ver calendario</Link></div><div className="dashboard-panel__body"><ul className="dashboard-list">{upcomingAssignments.map((a) => <li key={a._id}><span><strong>{a.request?.requiredProfessionalType || 'Servicio SST'}</strong><br /><small>{a.request?.city || 'Ciudad'} · {a.professional?.profile?.firstName || 'Profesional'}</small></span><span className="profile-chip">{a.status === 'in_execution' ? 'En ejecución' : 'Asignada'}</span></li>)}{upcomingAssignments.length === 0 && <li className="text-muted">No hay actividades próximas.</li>}</ul></div></div></div>
        <div className="col-lg-6"><div className="dashboard-panel"><div className="dashboard-panel__header"><h3>Resumen de gestión SST</h3><span className="profile-chip"><i className="bi bi-check-circle" /> Seguimiento activo</span></div><div className="dashboard-panel__body"><div className="dashboard-chart-row"><div className="dashboard-donut" data-total={`${managementPercent}%`} style={{ '--chart-percent': `${managementPercent}%`, '--chart-color': '#1ca56f' }} /><div><strong>Servicios activos</strong><p className="small text-muted mb-2">{activeServices} de {data.assignments.length} asignaciones requieren seguimiento.</p><Link to="/empresa/servicios" className="small">Ver gestión completa</Link></div></div></div></div></div>
      </div>
    </div>
  );
}
