import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalServices() {
  const [rows, setRows] = useState([]);
  const [reports, setReports] = useState({});
  const [deliverables, setDeliverables] = useState({});
  const [activities, setActivities] = useState({});
  const [busyId, setBusyId] = useState('');

  const load = () => api.get('/marketplace/assignments').then((r) => setRows((r.data || []).filter((a) => ['assigned', 'in_execution', 'finished', 'cancelled'].includes(a.status))));

  useEffect(() => {
    load();
  }, []);

  const startOrFinish = async (a, status) => {
    await api.patch(`/marketplace/assignments/${a._id}/status`, { status });
    load();
  };

  const decideAssignment = async (a, decision) => {
    const reason =
      decision === 'rejected' ? window.prompt('Motivo de rechazo (opcional):') || '' : '';
    setBusyId(a._id);
    try {
      await api.post(`/marketplace/assignments/${a._id}/decision`, { decision, reason });
      load();
    } finally {
      setBusyId('');
    }
  };

  const addReport = async (a) => {
    const activities = window.prompt('Actividades');
    if (!activities) return;
    const workedHours = window.prompt('Horas trabajadas');
    if (!workedHours) return;
    const inspections = window.prompt('Inspecciones');
    const observations = window.prompt('Observaciones');
    const photos = window.prompt('URLs fotos separadas por coma');

    await api.post(`/marketplace/assignments/${a._id}/reports`, {
      reportDate: new Date().toISOString(),
      activities,
      workedHours: Number(workedHours),
      inspections,
      observations,
      evidencePhotos: (photos || '').split(',').map((v) => v.trim()).filter(Boolean),
    });
  };

  const loadReports = async (id) => {
    const { data } = await api.get(`/marketplace/assignments/${id}/reports`);
    setReports((p) => ({ ...p, [id]: data || [] }));
  };

  const loadDeliverables = async (id) => {
    const { data } = await api.get(`/marketplace/assignments/${id}/deliverables`);
    setDeliverables((p) => ({ ...p, [id]: data || [] }));
  };

  const loadActivities = async (id) => {
    const { data } = await api.get(`/marketplace/assignments/${id}/activities`);
    setActivities((p) => ({ ...p, [id]: data || [] }));
  };

  const updateActivity = async (activity, status) => {
    await api.patch(`/marketplace/activities/${activity._id}`, { status });
    await loadActivities(activity.assignment);
  };

  const uploadDeliverable = async (a, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^.]+$/, ''));
    formData.append('type', 'evidence');
    await api.post(`/marketplace/assignments/${a._id}/deliverables`, formData);
    await loadDeliverables(a._id);
    event.target.value = '';
  };

  const rateCompany = async (a) => {
    const score = window.prompt('Calificación de la empresa (1 a 5):');
    if (!score || Number(score) < 1 || Number(score) > 5) return;
    const comment = window.prompt('Comentario (opcional):') || '';
    await api.post(`/marketplace/assignments/${a._id}/ratings`, { score: Number(score), comment });
    alert('Calificación registrada.');
  };

  return (
    <div>
      <h2 className="h4 mb-3">Mis servicios</h2>
      {rows.map((a) => (
        <div key={a._id} className="card card-bemc p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{a.request?.requiredProfessionalType || 'SST'} - {a.status}</strong>
            <div className="d-flex gap-2">
              {a.status === 'assigned' && a.professionalDecision !== 'accepted' && (
                <>
                  <button className="btn btn-sm btn-outline-success" disabled={busyId === a._id} onClick={() => decideAssignment(a, 'accepted')}>Aceptar</button>
                  <button className="btn btn-sm btn-outline-danger" disabled={busyId === a._id} onClick={() => decideAssignment(a, 'rejected')}>Rechazar</button>
                </>
              )}
              {a.status === 'assigned' && a.professionalDecision === 'accepted' && <button className="btn btn-sm btn-outline-primary" onClick={() => startOrFinish(a, 'in_execution')}>Iniciar</button>}
              {a.status === 'in_execution' && <button className="btn btn-sm btn-success" onClick={() => startOrFinish(a, 'finished')}>Finalizar</button>}
              {a.status === 'finished' && <button className="btn btn-sm btn-outline-warning" onClick={() => rateCompany(a)}><i className="bi bi-star me-1" /> Calificar empresa</button>}
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { loadReports(a._id); loadDeliverables(a._id); loadActivities(a._id); }}>Ver seguimiento</button>
            </div>
          </div>
          {a.status === 'assigned' && (
            <div className="small text-muted mb-2">
              Decisión profesional: {a.professionalDecision === 'accepted' ? 'aceptada' : a.professionalDecision === 'rejected' ? 'rechazada' : 'pendiente'}
            </div>
          )}
          {a.professionalDecisionReason && <div className="small text-muted mb-2">Motivo: {a.professionalDecisionReason}</div>}
          {a.status === 'in_execution' && <button className="btn btn-sm btn-bemc mb-2" onClick={() => addReport(a)}>Registrar reporte</button>}
          {['assigned', 'in_execution'].includes(a.status) && <label className="btn btn-sm btn-outline-primary mb-2 ms-2"><i className="bi bi-upload me-1" /> Cargar evidencia<input type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => uploadDeliverable(a, event)} /></label>}
          <ul className="mb-0">{(reports[a._id] || []).map((r) => <li key={r._id}>{new Date(r.reportDate).toLocaleDateString('es-CO')} - {r.activities} - {r.workedHours}h</li>)}</ul>
          {(deliverables[a._id] || []).length > 0 && <div className="mt-2"><strong className="small">Entregables</strong><ul className="small mb-0">{deliverables[a._id].map((d) => <li key={d._id}><a href={d.downloadUrl} target="_blank" rel="noreferrer">{d.title}</a> - {d.status}</li>)}</ul></div>}
          {(activities[a._id] || []).length > 0 && <div className="mt-2"><strong className="small">Actividades SST</strong><ul className="small mb-0">{activities[a._id].map((activity) => <li key={activity._id}>{activity.title} - {activity.status} {activity.status !== 'completed' && activity.status !== 'cancelled' && <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => updateActivity(activity, 'completed')}>Marcar completa</button>}</li>)}</ul></div>}
        </div>
      ))}
    </div>
  );
}
