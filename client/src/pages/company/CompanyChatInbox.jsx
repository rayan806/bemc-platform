import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

function formatDateTime(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-CO');
}

export default function CompanyChatInbox() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const { data } = await api.get('/marketplace/company/chat-inbox');
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible cargar los chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">Chat empresa</h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={load}>Actualizar</button>
      </div>

      {loading ? <div className="spinner-border text-primary" role="status" /> : null}
      {error ? <div className="alert alert-warning">{error}</div> : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="card card-bemc p-3">
          <p className="text-muted mb-0">No hay profesionales escribiendo aún.</p>
        </div>
      ) : null}

      <div className="d-grid gap-2">
        {rows.map((row) => (
          <div key={`${row.requestId}-${row.professionalId}`} className="card card-bemc p-3">
            <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <div className="fw-semibold">{row.professionalName}</div>
                <div className="small text-muted">{row.professionalType} · {row.professionalCity || 'Ciudad no definida'}</div>
                <div className="small text-muted">{row.professionalEmail}</div>
              </div>
              <div className="text-end small text-muted">
                <div>{row.requestTitle}</div>
                <div>{row.requestCity || 'Ciudad no definida'} · {row.requestStatus}</div>
              </div>
            </div>

            <div className="mt-2 p-2 border rounded bg-light">
              <div className="small"><strong>Ultimo mensaje:</strong> {row.lastMessage}</div>
              <div className="small text-muted">{formatDateTime(row.lastMessageAt)}</div>
            </div>

            <div className="mt-2">
              <Link className="btn btn-sm btn-bemc" to={`/empresa/espacio/${row.requestId}/${row.professionalId}`}>
                Seleccionar chat
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
