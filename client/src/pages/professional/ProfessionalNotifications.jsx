import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalNotifications() {
  const [rows, setRows] = useState([]);
  const [busyRequestId, setBusyRequestId] = useState('');
  const POLL_MS = 5000;

  const load = () => api.get('/notifications').then((r) => setRows(r.data || []));

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  const isRejectableNotification = (notification) =>
    Boolean(
      ['marketplace_match', 'marketplace_reopened'].includes(notification?.type)
      && notification?.payload?.requestId
    );

  const rejectFromNotification = async (notification) => {
    const requestId = notification?.payload?.requestId;
    if (!requestId) return;

    setBusyRequestId(requestId);
    try {
      await api.post(`/marketplace/requests/${requestId}/reject`);
      setRows((prev) => prev.filter(
        (row) => !(['marketplace_match', 'marketplace_reopened'].includes(row.type) && row?.payload?.requestId === requestId)
      ));
    } catch (err) {
      const status = err?.response?.status;
      if ([400, 404, 409].includes(status)) {
        setRows((prev) => prev.filter(
          (row) => !(['marketplace_match', 'marketplace_reopened'].includes(row.type) && row?.payload?.requestId === requestId)
        ));
        return;
      }
      alert(err.response?.data?.message || 'No se pudo rechazar la solicitud');
    } finally {
      setBusyRequestId('');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Notificaciones</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={load}>Actualizar</button>
          <button className="btn btn-sm btn-outline-primary" onClick={markAll}>Marcar todas</button>
        </div>
      </div>
      <div className="card card-bemc p-3">
        {rows.length === 0 ? <p className="text-muted mb-0">No tienes notificaciones.</p> : rows.map((n) => (
          <div key={n._id} className="border rounded p-2 mb-2">
            <div className="d-flex justify-content-between"><strong>{n.title}</strong><small>{new Date(n.createdAt).toLocaleString('es-CO')}</small></div>
            <div className="small text-muted mb-1">{n.message}</div>
            <div className="d-flex gap-3 align-items-center">
              {!n.readAt && <button className="btn btn-sm btn-link p-0" onClick={() => markRead(n._id)}>Marcar leída</button>}
              {isRejectableNotification(n) && (
                <button
                  className="btn btn-sm btn-link p-0 text-danger"
                  disabled={busyRequestId === n.payload.requestId}
                  onClick={() => rejectFromNotification(n)}
                >
                  Rechazar solicitud
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
