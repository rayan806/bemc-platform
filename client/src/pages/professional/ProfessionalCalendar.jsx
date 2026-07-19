import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalCalendar() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/marketplace/assignments').then((r) => setRows((r.data || []).filter((a) => ['assigned', 'in_execution'].includes(a.status))));
  }, []);

  return (
    <div>
      <h2 className="h4 mb-3">Calendario</h2>
      <div className="card card-bemc p-3">
        {rows.length === 0 ? <p className="text-muted mb-0">No tienes eventos programados.</p> : (
          <ul className="mb-0">{rows.map((a) => <li key={a._id}><strong>{a.request?.requiredProfessionalType || 'Servicio SST'}</strong> - {a.request?.city || '—'} - Inicio: {a.request?.startDate ? new Date(a.request.startDate).toLocaleDateString('es-CO') : 'Por definir'} - Estado: {a.status}</li>)}</ul>
        )}
      </div>
    </div>
  );
}
