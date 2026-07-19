import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

function SimpleBars({ title, rows }) {
  const max = useMemo(() => Math.max(...rows.map((r) => r.total), 1), [rows]);

  return (
    <div className="card card-bemc p-3 h-100">
      <h3 className="h6 mb-3">{title}</h3>
      {rows.map((r) => (
        <div key={r._id} className="mb-2">
          <div className="d-flex justify-content-between small mb-1"><span>{r._id}</span><strong>{r.total}</strong></div>
          <div style={{ background: 'var(--bemc-border)', borderRadius: 6, height: 8 }}>
            <div style={{ width: `${(r.total / max) * 100}%`, height: 8, borderRadius: 6, background: 'var(--bemc-primary)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/stats/extended').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h1 className="h3 mb-4">Estadisticas</h1>
      <div className="row g-3 mb-4">
        {Object.entries(data.totals || {}).map(([k, v]) => (
          <div key={k} className="col-6 col-md-3"><div className="stat-card"><div className="stat-value">{v}</div><div className="stat-label">{k}</div></div></div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-md-4"><SimpleBars title="Solicitudes consultoria" rows={data.distributions?.serviceRequests || []} /></div>
        <div className="col-md-4"><SimpleBars title="Solicitudes marketplace" rows={data.distributions?.marketplaceRequests || []} /></div>
        <div className="col-md-4"><SimpleBars title="Pagos" rows={data.distributions?.payments || []} /></div>
      </div>
    </div>
  );
}
