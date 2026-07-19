import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminControlCenter() {
  const [quotes, setQuotes] = useState([]);
  const [reports, setReports] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/public-quotes'),
      api.get('/admin/marketplace/reports'),
      api.get('/admin/marketplace/ratings'),
    ]).then(([q, r, ra]) => {
      setQuotes(q.data || []);
      setReports(r.data || []);
      setRatings(ra.data || []);
    });
  }, []);

  const updateQuote = async (id, status) => {
    await api.patch(`/admin/public-quotes/${id}/status`, { status });
    const { data } = await api.get('/admin/public-quotes');
    setQuotes(data || []);
  };

  return (
    <div>
      <h1 className="h3 mb-4">Centro de control</h1>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Cotizaciones publicas</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Empresa</th><th>Contacto</th><th>Ciudad</th><th>Necesidad</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q._id}>
                  <td>{q.companyName}</td>
                  <td>{q.contactName}<div className="small text-muted">{q.email}</div></td>
                  <td>{q.city || '—'}</td>
                  <td>{q.serviceNeed}</td>
                  <td>{q.status}</td>
                  <td>
                    <select className="form-select form-select-sm" value={q.status} onChange={(e) => updateQuote(q._id, e.target.value)}>
                      <option value="new">new</option>
                      <option value="in_review">in_review</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white fw-semibold">Reportes Marketplace</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Profesional</th><th>Fecha</th><th>Horas</th><th>Actividades</th></tr></thead>
            <tbody>
              {reports.slice(0, 100).map((r) => (
                <tr key={r._id}>
                  <td>{r.professional?.profile?.firstName || ''} {r.professional?.profile?.lastName || ''}</td>
                  <td>{new Date(r.reportDate).toLocaleDateString('es-CO')}</td>
                  <td>{r.workedHours}</td>
                  <td className="small">{r.activities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold">Calificaciones Marketplace</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead><tr><th>Tipo</th><th>De</th><th>Para</th><th>Puntaje</th><th>Comentario</th></tr></thead>
            <tbody>
              {ratings.slice(0, 100).map((r) => (
                <tr key={r._id}>
                  <td>{r.type}</td>
                  <td>{r.fromUser?.profile?.firstName || ''} {r.fromUser?.profile?.lastName || ''}</td>
                  <td>{r.toUser?.profile?.firstName || ''} {r.toUser?.profile?.lastName || ''}</td>
                  <td>{r.score}</td>
                  <td>{r.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
