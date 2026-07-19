import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminProfessionals() {
  const [rows, setRows] = useState([]);

  const load = () => api.get('/admin/professionals').then((r) => setRows(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (row) => {
    await api.patch(`/admin/professionals/${row._id}/status`, { isActive: !row.isActive });
    load();
  };

  return (
    <div>
      <h1 className="h3 mb-4">Profesionales SST</h1>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Nombre</th><th>Correo</th><th>Profesion</th><th>Experiencia</th><th>Disponibilidad</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p._id}>
                <td>{p.profile?.firstName || ''} {p.profile?.lastName || ''}</td>
                <td>{p.email}</td>
                <td>{p.professionalProfile?.mainProfession || 'Profesional SST'}</td>
                <td>{p.professionalProfile?.yearsExperience || 0} años</td>
                <td>{p.professionalProfile?.availabilityStatus || 'available'}</td>
                <td>{p.isActive ? 'Activo' : 'Suspendido'}</td>
                <td><button className="btn btn-sm btn-outline-secondary" onClick={() => toggleStatus(p)}>{p.isActive ? 'Suspender' : 'Aprobar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
