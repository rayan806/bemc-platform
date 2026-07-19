import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function CompanyRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/marketplace/requests').then((r) => setRows(r.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h2 className="h4 mb-3">Mis solicitudes</h2>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Estado</th><th>Fecha</th><th>Tipo</th><th>Ciudad</th><th>Profesional asignado</th><th>Servicio</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.status}</td>
                <td>{new Date(r.createdAt).toLocaleDateString('es-CO')}</td>
                <td>{r.requiredProfessionalType}</td>
                <td>{r.city}</td>
                <td>{r.selectedProfessional ? `${r.selectedProfessional.profile?.firstName || ''} ${r.selectedProfessional.profile?.lastName || ''}` : 'Pendiente'}</td>
                <td>{r.status === 'in_execution' ? 'Activo' : r.status === 'finished' ? 'Finalizado' : 'En gestion'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
