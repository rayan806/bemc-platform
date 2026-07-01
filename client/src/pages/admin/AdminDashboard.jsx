import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const statusLabels = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  in_progress: 'En curso',
  completed: 'Completado',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="spinner-border text-primary" />;
  }

  const { stats, recentRequests, alerts } = data || {};

  const statCards = [
    { label: 'Clientes', value: stats?.totalClients },
    { label: 'Empresas', value: stats?.totalCompanies },
    { label: 'Servicios en curso', value: stats?.activeServices },
    { label: 'Completados', value: stats?.completedServices },
    { label: 'Pagos recibidos', value: stats?.paidPayments },
    { label: 'Pagos pendientes', value: stats?.pendingPayments },
    { label: 'Documentos', value: stats?.totalDocuments },
    { label: 'Solicitudes sin pagar', value: stats?.newRequests },
  ];

  return (
    <div>
      <h1 className="h3 mb-4">Dashboard</h1>

      {alerts?.length > 0 && (
        <div className="mb-4">
          {alerts.map((a, i) => (
            <div key={i} className="alert alert-warning py-2 mb-2">
              <i className="bi bi-exclamation-triangle me-2" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="row g-3 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-value">{s.value ?? 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between">
          <span className="fw-semibold">Solicitudes recientes</span>
          <Link to="/admin/solicitudes">Ver todas</Link>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests?.map((r) => (
                <tr key={r._id}>
                  <td>
                    {r.client?.profile?.firstName} {r.client?.profile?.lastName}
                    <div className="small text-muted">{r.client?.email}</div>
                  </td>
                  <td>{r.service?.name}</td>
                  <td>
                    <span className={`badge badge-status badge-${r.status}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
