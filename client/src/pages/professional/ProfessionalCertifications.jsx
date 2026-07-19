import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalCertifications() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ type: 'licencia_sst', title: '', fileUrl: '', issuedAt: '', expiresAt: '' });

  const load = () => api.get('/marketplace/professionals/me').then((r) => setRows(r.data?.certifications || []));
  useEffect(() => { load(); }, []);

  const createCert = async (e) => {
    e.preventDefault();
    await api.post('/marketplace/professionals/me/certifications', {
      ...form,
      issuedAt: form.issuedAt || undefined,
      expiresAt: form.expiresAt || undefined,
    });
    setForm({ type: 'licencia_sst', title: '', fileUrl: '', issuedAt: '', expiresAt: '' });
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-3">Mis Certificaciones</h2>
      <form className="card card-bemc p-3 mb-3 row g-2" onSubmit={createCert}>
        <div className="col-md-2"><select className="form-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}><option value="licencia_sst">Licencia SST</option><option value="coordinador_alturas">Coordinador alturas</option><option value="curso_50h">Curso 50h</option><option value="curso_20h">Curso 20h</option><option value="espacios_confinados">Espacios confinados</option><option value="primeros_auxilios">Primeros auxilios</option><option value="otra">Otra</option></select></div>
        <div className="col-md-3"><input className="form-control" placeholder="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
        <div className="col-md-3"><input className="form-control" placeholder="URL archivo" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required /></div>
        <div className="col-md-2"><input type="date" className="form-control" value={form.issuedAt} onChange={(e) => setForm((p) => ({ ...p, issuedAt: e.target.value }))} /></div>
        <div className="col-md-1"><input type="date" className="form-control" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
        <div className="col-md-1"><button className="btn btn-bemc w-100" type="submit">+</button></div>
      </form>

      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Título</th><th>Tipo</th><th>Expedición</th><th>Vencimiento</th><th>Estado</th></tr></thead>
          <tbody>{rows.map((c) => <tr key={c._id}><td><a href={c.fileUrl} target="_blank" rel="noreferrer">{c.title}</a></td><td>{c.type}</td><td>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('es-CO') : '—'}</td><td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : '—'}</td><td>{c.isVerified ? 'Verificada' : 'Pendiente'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
