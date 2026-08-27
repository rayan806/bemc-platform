/**
 * Archivo: client/src/pages/admin/AdminDashboard.jsx
 * Proposito: Metricas principales para operacion administrativa.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const statusLabels = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagado',
  in_progress: 'En curso',
  completed: 'Completado',
};

// Componente principal de esta vista.
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
    { label: 'Empresas', value: stats?.totalCompanies, icon: 'bi-building', color: '#1ca56f' },
    { label: 'Profesionales SST', value: stats?.totalProfessionals, icon: 'bi-people', color: '#2589d8' },
    { label: 'Solicitudes abiertas', value: stats?.marketplaceActiveRequests, icon: 'bi-clipboard2', color: '#7652d8' },
    { label: 'Servicios en ejecución', value: stats?.marketplaceServicesInExecution, icon: 'bi-briefcase', color: '#f28b24' },
    { label: 'Servicios finalizados', value: stats?.completedServices, icon: 'bi-check-circle', color: '#1ca56f' },
    { label: 'Pagos recibidos', value: stats?.paidPayments, icon: 'bi-cash-coin', color: '#1ca56f' },
    { label: 'Documentos', value: stats?.totalDocuments, icon: 'bi-file-earmark-text', color: '#2589d8' },
    { label: 'Profesionales disponibles', value: stats?.availableProfessionals, icon: 'bi-person-check', color: '#7652d8' },
  ];

  const activeTotal = (stats?.marketplaceActiveRequests || 0) + (stats?.marketplaceFinishedRequests || 0);
  const activePercent = activeTotal ? Math.round((stats.marketplaceActiveRequests / activeTotal) * 100) : 0;
  const finishedPercent = activeTotal ? 100 - activePercent : 0;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-heading">
        <div>
          <h2>Dashboard Administrador</h2>
          <p>Vista global de la operación y actividad de B.E.M.C.</p>
        </div>
        <div className="dashboard-date"><i className="bi bi-calendar3" /> Últimos 30 días <i className="bi bi-chevron-down" /></div>
      </div>

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
            <div className="dashboard-stat">
              <div className="dashboard-stat__top"><span className="dashboard-stat__icon" style={{ background: s.color }}><i className={`bi ${s.icon}`} /></span><i className="bi bi-three-dots text-muted" /></div>
              <div className="dashboard-stat__value">{s.value ?? 0}</div>
              <div className="dashboard-stat__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header"><h3>Solicitudes por estado</h3><Link to="/admin/solicitudes">Ver detalle</Link></div>
            <div className="dashboard-panel__body dashboard-chart-row">
              <div className="dashboard-donut" data-total={activeTotal} style={{ '--chart-percent': `${activePercent}%`, '--chart-color': '#2589d8' }} />
              <ul className="dashboard-legend"><li>Activas <strong>{stats?.marketplaceActiveRequests || 0}</strong></li><li>Finalizadas <strong>{stats?.marketplaceFinishedRequests || 0}</strong></li><li>Sin pagar <strong>{stats?.newRequests || 0}</strong></li></ul>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header"><h3>Servicios por estado</h3><Link to="/admin/servicios">Ver detalle</Link></div>
            <div className="dashboard-panel__body dashboard-chart-row">
              <div className="dashboard-donut" data-total={stats?.activeServices || 0} style={{ '--chart-percent': `${stats?.activeServices ? 72 : 0}%`, '--chart-color': '#1ca56f' }} />
              <ul className="dashboard-legend"><li>En ejecución <strong>{stats?.activeServices || 0}</strong></li><li>Finalizados <strong>{stats?.completedServices || 0}</strong></li><li>Pagos pendientes <strong>{stats?.pendingPayments || 0}</strong></li></ul>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header"><h3>Resumen financiero</h3><Link to="/admin/pagos">Ver pagos</Link></div>
            <div className="dashboard-panel__body"><ul className="dashboard-list"><li><span>Pagos recibidos</span><strong>{stats?.paidPayments || 0}</strong></li><li><span>Pagos pendientes</span><strong>{stats?.pendingPayments || 0}</strong></li><li><span>Solicitudes sin pagar</span><strong>{stats?.newRequests || 0}</strong></li></ul></div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="dashboard-panel__header">
          <h3>Solicitudes recientes</h3>
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
