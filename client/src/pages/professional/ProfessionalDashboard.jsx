import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalDashboard() {
  const [summary, setSummary] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/marketplace/summary'),
      api.get('/marketplace/opportunities'),
      api.get('/marketplace/history'),
    ]).then(([s, o, h]) => {
      setSummary(s.data);
      setOpportunities(o.data || []);
      setHistory(h.data || []);
    });
  }, []);

  if (!summary) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h2 className="h4 mb-4">Dashboard Profesional SST</h2>
      <div className="row g-3 mb-4">
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">{opportunities.length}</div><div className="stat-label">Solicitudes disponibles</div></div></div>
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">{summary.activeServices || 0}</div><div className="stat-label">Servicios activos</div></div></div>
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">{summary.assignedServices || 0}</div><div className="stat-label">Servicios programados</div></div></div>
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">{history.length}</div><div className="stat-label">Historial</div></div></div>
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">{summary.profile?.ratingAvg || 0}</div><div className="stat-label">Calificacion</div></div></div>
        <div className="col-md-2"><div className="stat-card"><div className="stat-value">${(summary.assignedServices || 0) * 350000}</div><div className="stat-label">Ganancias estimadas</div></div></div>
      </div>
      <div className="card card-bemc p-3">
        <h3 className="h6">Disponibilidad actual</h3>
        <div className="text-muted">{summary.profile?.availabilityStatus || 'available'}</div>
      </div>
    </div>
  );
}
