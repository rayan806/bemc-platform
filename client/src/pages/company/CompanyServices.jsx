import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function CompanyServices() {
  const [assignments, setAssignments] = useState([]);
  const [reports, setReports] = useState({});

  useEffect(() => {
    api.get('/marketplace/assignments').then((r) => setAssignments((r.data || []).filter((a) => ['assigned', 'in_execution', 'finished'].includes(a.status))));
  }, []);

  const loadReports = async (id) => {
    const { data } = await api.get(`/marketplace/assignments/${id}/reports`);
    setReports((p) => ({ ...p, [id]: data || [] }));
  };

  return (
    <div>
      <h2 className="h4 mb-3">Servicios</h2>
      {assignments.map((a) => (
        <div key={a._id} className="card card-bemc p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{a.request?.requiredProfessionalType || 'SST'} - {a.status}</strong>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => loadReports(a._id)}>Ver reportes</button>
          </div>
          <div className="small text-muted mb-2">Profesional: {a.professional?.profile?.firstName || ''} {a.professional?.profile?.lastName || ''}</div>
          <ul className="mb-0">
            {(reports[a._id] || []).map((r) => (
              <li key={r._id}>{new Date(r.reportDate).toLocaleDateString('es-CO')} - {r.activities} - {r.workedHours}h - {r.observations || 'Sin observaciones'}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
