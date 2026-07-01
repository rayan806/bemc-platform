import { useEffect, useState } from 'react';
import api from '../../api/client';

const statusLabels = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const statuses = ['pending_payment', 'paid', 'in_progress', 'completed', 'cancelled'];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    const params = filter ? { status: filter } : {};
    api
      .get('/requests', { params })
      .then((res) => setRequests(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/requests/${id}`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 className="h3 mb-4">Solicitudes de clientes</h1>

      <div className="mb-3">
        <select
          className="form-select w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded">
            <thead className="table-light">
              <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Servicio</th>
                <th>Requerimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div>{r.client?.profile?.firstName} {r.client?.profile?.lastName}</div>
                    <small className="text-muted">{r.client?.email}</small>
                  </td>
                  <td>{r.company?.legalName || '—'}</td>
                  <td>{r.service?.name}</td>
                  <td className="small" style={{ maxWidth: 200 }}>
                    {r.clientNotes || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-status badge-${r.status}`}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={r.status}
                      disabled={updating === r._id}
                      onChange={(e) => updateStatus(r._id, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
