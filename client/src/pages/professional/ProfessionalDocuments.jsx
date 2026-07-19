import { useEffect, useState } from 'react';
import api from '../../api/client';

const types = [
  'licencia_sst', 'cedula', 'tarjeta_profesional', 'hoja_vida', 'certificado_laboral', 'certificado_experiencia',
  'certificado_estudio', 'diplomado', 'especializacion', 'maestria', 'curso_50h', 'curso_20h',
  'coordinador_alturas', 'espacios_confinados', 'primeros_auxilios', 'otro',
];

export default function ProfessionalDocuments() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'licencia_sst', fileUrl: '', expiresAt: '', status: 'active' });

  const load = () => api.get('/marketplace/professionals/me/documents').then((r) => setRows(r.data || []));
  useEffect(() => { load(); }, []);

  const createDoc = async (e) => {
    e.preventDefault();
    await api.post('/marketplace/professionals/me/documents', {
      ...form,
      expiresAt: form.expiresAt || undefined,
    });
    setForm({ name: '', type: 'licencia_sst', fileUrl: '', expiresAt: '', status: 'active' });
    load();
  };

  const replaceDoc = async (row) => {
    const fileUrl = window.prompt('Nueva URL del archivo', row.fileUrl || '');
    if (!fileUrl) return;
    await api.put(`/marketplace/professionals/me/documents/${row._id}`, { fileUrl });
    load();
  };

  const removeDoc = async (id) => {
    if (!window.confirm('¿Eliminar documento?')) return;
    await api.delete(`/marketplace/professionals/me/documents/${id}`);
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-3">Mis Documentos</h2>
      <form className="card card-bemc p-3 mb-3 row g-2" onSubmit={createDoc}>
        <div className="col-md-3"><input className="form-control" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="col-md-3"><select className="form-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        <div className="col-md-3"><input className="form-control" placeholder="URL archivo" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required /></div>
        <div className="col-md-2"><input type="date" className="form-control" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
        <div className="col-md-1"><button className="btn btn-bemc w-100" type="submit">+</button></div>
      </form>

      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Nombre</th><th>Tipo</th><th>Fecha carga</th><th>Vence</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d._id}>
                <td><a href={d.fileUrl} target="_blank" rel="noreferrer">{d.name}</a></td>
                <td>{d.type}</td>
                <td>{new Date(d.createdAt).toLocaleDateString('es-CO')}</td>
                <td>{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('es-CO') : '—'}</td>
                <td>{d.status}</td>
                <td className="d-flex gap-1"><button className="btn btn-sm btn-outline-primary" onClick={() => replaceDoc(d)}>Reemplazar</button><button className="btn btn-sm btn-outline-danger" onClick={() => removeDoc(d._id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
