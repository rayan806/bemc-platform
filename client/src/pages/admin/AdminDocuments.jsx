import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminDocuments() {
  const [rows, setRows] = useState([]);

  const load = () => api.get('/admin/documents').then((r) => setRows(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const review = async (id, isApproved) => {
    const reviewNotes = window.prompt('Notas de revision (opcional):') || '';
    await api.patch(`/admin/documents/${id}/review`, { isApproved, reviewNotes });
    load();
  };

  return (
    <div>
      <h1 className="h3 mb-4">Gestion documental</h1>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Titulo</th><th>Categoria</th><th>Archivo</th><th>Subido por</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d._id}>
                <td>{d.title}</td>
                <td>{d.category}</td>
                <td>{d.fileName}</td>
                <td>{d.uploadedBy?.email || '—'}</td>
                <td>{d.isApproved === true ? 'Aprobado' : d.isApproved === false ? 'Rechazado' : 'Pendiente'}</td>
                <td className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-success" onClick={() => review(d._id, true)}>Aprobar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => review(d._id, false)}>Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
