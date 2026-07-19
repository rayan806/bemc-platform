import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalServices() {
  const [rows, setRows] = useState([]);
  const [reports, setReports] = useState({});
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
              <button className="btn btn-sm btn-outline-secondary" onClick={() => loadReports(a._id)}>Ver reportes</button>
            </div>
          </div>
          {a.status === 'assigned' && (
            <div className="small text-muted mb-2">
              Decisión profesional: {a.professionalDecision === 'accepted' ? 'aceptada' : a.professionalDecision === 'rejected' ? 'rechazada' : 'pendiente'}
            </div>
          )}
          {a.professionalDecisionReason && <div className="small text-muted mb-2">Motivo: {a.professionalDecisionReason}</div>}
          {a.status === 'in_execution' && <button className="btn btn-sm btn-bemc mb-2" onClick={() => addReport(a)}>Registrar reporte</button>}
          <ul className="mb-0">{(reports[a._id] || []).map((r) => <li key={r._id}>{new Date(r.reportDate).toLocaleDateString('es-CO')} - {r.activities} - {r.workedHours}h</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
