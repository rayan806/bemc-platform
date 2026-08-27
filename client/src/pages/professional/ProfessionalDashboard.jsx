import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

function toStatusLabel(value) {
  if (value === 'available') return 'Disponible';
  if (value === 'busy') return 'Ocupado';
  if (value === 'unavailable') return 'No disponible';
  return 'Sin definir';
}

function getExpiringCount(items, days = 45) {
  const now = Date.now();
  const limit = now + days * 24 * 60 * 60 * 1000;
  return (items || []).filter((item) => {
    if (!item?.expiresAt) return false;
    const ts = new Date(item.expiresAt).getTime();
    return ts >= now && ts <= limit;
  }).length;
}

export default function ProfessionalDashboard() {
  const [summary, setSummary] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [history, setHistory] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [me, setMe] = useState({ certifications: [], documents: [] });
  const POLL_MS = 5000;

  const loadNotifications = () => api.get('/notifications').then((n) => setNotifications(n.data || []));

  useEffect(() => {
    Promise.all([
      api.get('/marketplace/summary'),
      api.get('/marketplace/opportunities'),
      api.get('/marketplace/history'),
      api.get('/marketplace/assignments'),
      api.get('/notifications'),
      api.get('/marketplace/professionals/me'),
    ]).then(([s, o, h, a, n, meRes]) => {
      setSummary(s.data);
      setOpportunities(o.data || []);
      setHistory(h.data || []);
      setAssignments(a.data || []);
      setNotifications(n.data || []);
      setMe({
        certifications: meRes.data?.certifications || [],
        documents: meRes.data?.documents || [],
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.readAt).length;
  const recentNotifications = notifications.slice(0, 5);
  const uniqueCompanies = new Set(assignments.map((row) => row?.company?._id).filter(Boolean)).size;

  if (!summary) return <div className="spinner-border text-primary" />;

  const expiringDocuments = getExpiringCount(me.documents, 45);
  const expiringCertifications = getExpiringCount(me.certifications, 45);
  const totalExpiring = expiringDocuments + expiringCertifications;

  const completionPercent = summary.completion?.percentage || 0;
  const completionColor = completionPercent >= 85 ? 'bg-success' : completionPercent >= 60 ? 'bg-warning' : 'bg-danger';

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading">
        <div>
          <h2 className="h4 mb-1">Dashboard Profesional SST</h2>
          <p className="text-muted mb-0">Resumen de tu actividad y estado de tu hoja de vida digital.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <div className="dashboard-date"><i className="bi bi-calendar3" /> Actividad reciente</div>
          <Link to="/profesional/solicitudes" className="btn btn-bemc btn-sm"><i className="bi bi-search me-1" /> Ver solicitudes</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[['Perfil completado', `${completionPercent}%`, 'bi-person-check', '#1ca56f'], ['Solicitudes nuevas', opportunities.length, 'bi-briefcase', '#2589d8'], ['Postulaciones activas', summary.activeApplications || 0, 'bi-send-check', '#7652d8'], ['Servicios en ejecución', summary.activeServices || 0, 'bi-tools', '#f28b24'], ['Servicios finalizados', summary.finishedServices || history.length, 'bi-check-circle', '#1ca56f'], ['Calificación promedio', summary.profile?.ratingAvg || 0, 'bi-star-fill', '#e8a838'], ['Empresas contratantes', uniqueCompanies, 'bi-building', '#2589d8'], ['Documentos por vencer', totalExpiring, 'bi-file-earmark-excel', '#c94c4c']].map(([label, value, icon, color]) => (
          <div key={label} className="col-6 col-md-3"><div className="dashboard-stat"><div className="dashboard-stat__top"><span className="dashboard-stat__icon" style={{ background: color }}><i className={`bi ${icon}`} /></span></div><div className="dashboard-stat__value">{value}</div><div className="dashboard-stat__label">{label}</div></div></div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header"><h3>Mi avance general</h3><span className="profile-chip"><i className="bi bi-circle-fill" /> {toStatusLabel(summary.profile?.availabilityStatus)}</span></div>
            <div className="dashboard-panel__body">
              <div className="dashboard-chart-row mb-3"><div className="dashboard-donut" data-total={`${completionPercent}%`} style={{ '--chart-percent': `${completionPercent}%`, '--chart-color': '#1ca56f' }} /><div><strong>Perfil completado</strong><p className="small text-muted mb-0">Completa tu información para recibir mejores oportunidades.</p><Link to="/profesional/perfil" className="small">Completar perfil</Link></div></div>
              <div className="small text-muted mb-2">Licencia SST: {summary.profile?.licenseStatus === 'valid' ? 'Vigente' : 'Pendiente de validar'}</div>
              <div className="progress" style={{ height: 8 }}><div className="progress-bar bg-success" style={{ width: `${completionPercent}%` }} /></div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header"><h3>Notificaciones recientes</h3><span className="badge text-bg-danger">{unreadNotifications} sin leer</span></div>
            <div className="dashboard-panel__body">
              {recentNotifications.length === 0 ? <p className="small text-muted mb-0">No tienes notificaciones recientes.</p> : <ul className="dashboard-list">{recentNotifications.map((n) => <li key={n._id}><span><strong>{n.title}</strong><br /><small>{n.message}</small></span><small>Ahora</small></li>)}</ul>}
              <Link to="/profesional/notificaciones" className="btn btn-sm btn-outline-primary mt-3">Ver todas</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
