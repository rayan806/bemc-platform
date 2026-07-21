import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function CompanyRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/marketplace/requests').then((r) => setRows(r.data || []));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const canRepublish = (status) => ['draft', 'cancelled', 'finished'].includes(status);

  const republish = async (requestId) => {
    setBusyId(requestId);
    setMsg('');
    try {
      await api.post(`/marketplace/requests/${requestId}/republish`);
      setMsg('Solicitud re-publicada correctamente. Ya fue enviada a profesionales compatibles.');
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'No se pudo re-publicar la solicitud');
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h2 className="h4 mb-3">Mis solicitudes</h2>
      {msg && <div className="alert alert-info py-2">{msg}</div>}
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Estado</th><th>Fecha</th><th>Tipo</th><th>Ciudad</th><th>Profesional asignado</th><th>Servicio</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.status}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                <td>{r.requiredProfessionalType}</td>
                <td>{r.city}</td>
                <td>{r.selectedProfessional ? `${r.selectedProfessional.profile?.firstName || ''} ${r.selectedProfessional.profile?.lastName || ''}` : 'Pendiente'}</td>
                <td>{r.status === 'in_execution' ? 'Activo' : r.status === 'finished' ? 'Finalizado' : 'En gestion'}</td>
                <td>
                  {canRepublish(r.status) ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      disabled={busyId === r._id}
                      onClick={() => republish(r._id)}
                    >
                      {busyId === r._id ? 'Re-publicando...' : 'Volver a publicar'}
                    </button>
                  ) : (
                    <span className="text-muted small">Sin acción</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
