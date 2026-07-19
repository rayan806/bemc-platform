import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalNotifications() {
  const [rows, setRows] = useState([]);

  const load = () => api.get('/notifications').then((r) => setRows(r.data || []));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h4 mb-0">Notificaciones</h2><button className="btn btn-sm btn-outline-primary" onClick={markAll}>Marcar todas</button></div>
      <div className="card card-bemc p-3">
        {rows.length === 0 ? <p className="text-muted mb-0">No tienes notificaciones.</p> : rows.map((n) => (
          <div key={n._id} className="border rounded p-2 mb-2">
            <div className="d-flex justify-content-between"><strong>{n.title}</strong><small>{new Date(n.createdAt).toLocaleString('es-CO')}</small></div>
            <div className="small text-muted mb-1">{n.message}</div>
            {!n.readAt && <button className="btn btn-sm btn-link p-0" onClick={() => markRead(n._id)}>Marcar leída</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
