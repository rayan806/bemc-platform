import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalHistory() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/marketplace/history').then((r) => setRows(r.data || []));
  }, []);

  return (
    <div>
      <h2 className="h4 mb-3">Historial</h2>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Servicio</th><th>Empresa</th><th>Ciudad</th><th>Finalizacion</th></tr></thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h._id}>
                <td>{h.request?.requiredProfessionalType || 'SST'}</td>
                <td>{h.company?.legalName || 'Empresa'}</td>
                <td>{h.request?.city || '—'}</td>
                <td>{h.finishedAt ? new Date(h.finishedAt).toLocaleDateString('es-CO') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
