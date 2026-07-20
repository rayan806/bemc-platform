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
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">Dashboard Profesional SST</h2>
          <p className="text-muted mb-0">Resumen de tu actividad y estado de tu hoja de vida digital.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/profesional/perfil" className="btn btn-bemc btn-sm">Mi hoja de vida</Link>
          <Link to="/profesional/solicitudes" className="btn btn-outline-primary btn-sm">Ver solicitudes</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{completionPercent}%</div><div className="stat-label">Perfil completado</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{opportunities.length}</div><div className="stat-label">Solicitudes nuevas</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{summary.activeApplications || 0}</div><div className="stat-label">Postulaciones activas</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{summary.activeServices || 0}</div><div className="stat-label">Servicios en ejecución</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{summary.finishedServices || history.length}</div><div className="stat-label">Servicios finalizados</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{summary.profile?.ratingAvg || 0}</div><div className="stat-label">Calificación promedio</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{uniqueCompanies}</div><div className="stat-label">Empresas contratantes</div></div></div>
        <div className="col-sm-6 col-xl-3"><div className="stat-card"><div className="stat-value">{totalExpiring}</div><div className="stat-label">Documentos por vencer</div></div></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card card-bemc p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Estado profesional</h3>
              <span className="badge text-bg-light">{toStatusLabel(summary.profile?.availabilityStatus)}</span>
            </div>
            <div className="progress mb-2" style={{ height: 10 }}>
              <div className={`progress-bar ${completionColor}`} style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="small text-muted mb-2">Perfil completado: {completionPercent}%</div>
            <ul className="small mb-0">
              <li>Licencia SST: {summary.profile?.licenseStatus === 'valid' ? 'Vigente' : 'Pendiente de validar'}</li>
              <li>Certificaciones: {me.certifications.length} registradas</li>
              <li>Documentos: {me.documents.length} cargados</li>
              <li>Vencimientos en 45 días: {totalExpiring}</li>
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card card-bemc p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Notificaciones recientes</h3>
              <span className="badge text-bg-danger">{unreadNotifications} sin leer</span>
            </div>
            {recentNotifications.length === 0 ? (
              <p className="small text-muted mb-0">No tienes notificaciones recientes.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {recentNotifications.map((n) => (
                  <li key={n._id} className="border rounded p-2 mb-2">
                    <div className="fw-semibold small">{n.title}</div>
                    <div className="small text-muted">{n.message}</div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/profesional/notificaciones" className="btn btn-sm btn-outline-primary mt-2">Ver todas</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
