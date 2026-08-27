import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function CompanyServices() {
  const [assignments, setAssignments] = useState([]);
  const [reports, setReports] = useState({});
  const [deliverables, setDeliverables] = useState({});
  const [activities, setActivities] = useState({});

  useEffect(() => {
    api.get('/marketplace/assignments').then((r) => setAssignments((r.data || []).filter((a) => ['assigned', 'in_execution', 'finished', 'cancelled'].includes(a.status))));
  }, []);

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

  const reviewDeliverable = async (id, status) => {
    const reviewNotes = window.prompt('Observaciones de revisión (opcional):') || '';
    await api.patch(`/marketplace/deliverables/${id}/review`, { status, reviewNotes });
    await loadDeliverables(assignments.find((a) => (deliverables[a._id] || []).some((d) => d._id === id))?._id);
  };

  const rateProfessional = async (a) => {
    const score = window.prompt('Calificación del profesional (1 a 5):');
    if (!score || Number(score) < 1 || Number(score) > 5) return;
    const comment = window.prompt('Comentario (opcional):') || '';
    await api.post(`/marketplace/assignments/${a._id}/ratings`, { score: Number(score), comment });
    alert('Calificación registrada.');
  };

  return (
    <div>
      <h2 className="h4 mb-3">Servicios</h2>
      {assignments.map((a) => (
        <div key={a._id} className="card card-bemc p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{a.request?.requiredProfessionalType || 'SST'} - {a.status}</strong>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { loadReports(a._id); loadDeliverables(a._id); loadActivities(a._id); }}>Ver seguimiento</button>
            {a.status === 'finished' && <button className="btn btn-sm btn-outline-warning" onClick={() => rateProfessional(a)}><i className="bi bi-star me-1" /> Calificar</button>}
          </div>
          <div className="small text-muted mb-2">Profesional: {a.professional?.profile?.firstName || ''} {a.professional?.profile?.lastName || ''}</div>
          <div className="small text-muted mb-2">
            Decisión del profesional: {a.professionalDecision === 'accepted' ? 'aceptada' : a.professionalDecision === 'rejected' ? 'rechazada' : 'pendiente'}
          </div>
          {a.professionalDecisionReason && <div className="small text-muted mb-2">Motivo: {a.professionalDecisionReason}</div>}
          <ul className="mb-0">
            {(reports[a._id] || []).map((r) => (
              <li key={r._id}>{new Date(r.reportDate).toLocaleDateString('es-CO')} - {r.activities} - {r.workedHours}h - {r.observations || 'Sin observaciones'}</li>
            ))}
          </ul>
          {(deliverables[a._id] || []).length > 0 && <div className="mt-3"><strong className="small">Documentos y evidencias</strong><ul className="small mb-0">{deliverables[a._id].map((d) => <li key={d._id}><a href={d.downloadUrl} target="_blank" rel="noreferrer">{d.title}</a> - {d.status} {d.status === 'pending' && <><button className="btn btn-link btn-sm text-success p-0 ms-2" onClick={() => reviewDeliverable(d._id, 'approved')}>Aprobar</button><button className="btn btn-link btn-sm text-danger p-0 ms-2" onClick={() => reviewDeliverable(d._id, 'rejected')}>Rechazar</button></>}</li>)}</ul></div>}
          {(activities[a._id] || []).length > 0 && <div className="mt-3"><strong className="small">Actividades SST</strong><ul className="small mb-0">{activities[a._id].map((activity) => <li key={activity._id}>{activity.title} - {activity.status}{activity.dueDate ? ` · vence ${new Date(activity.dueDate).toLocaleDateString('es-CO')}` : ''}</li>)}</ul></div>}
        </div>
      ))}
    </div>
  );
}
