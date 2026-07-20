import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

const typeLabels = {
  licencia_sst: 'Licencia SST',
  cedula: 'Cedula',
  tarjeta_profesional: 'Tarjeta profesional',
  hoja_vida: 'Hoja de vida',
  certificado_laboral: 'Certificado laboral',
  certificado_experiencia: 'Certificado de experiencia',
  certificado_estudio: 'Certificado de estudio',
  diplomado: 'Diplomado',
  especializacion: 'Especializacion',
  maestria: 'Maestria',
  curso_50h: 'Curso 50 horas',
  curso_20h: 'Curso 20 horas',
  coordinador_alturas: 'Coordinador de alturas',
  espacios_confinados: 'Espacios confinados',
  primeros_auxilios: 'Primeros auxilios',
  otro: 'Otro',
};

const categoryMap = {
  licencias: ['licencia_sst', 'tarjeta_profesional', 'cedula'],
  experiencia: ['hoja_vida', 'certificado_laboral', 'certificado_experiencia'],
  formacion: ['certificado_estudio', 'diplomado', 'especializacion', 'maestria'],
  cursos: ['curso_50h', 'curso_20h', 'coordinador_alturas', 'espacios_confinados', 'primeros_auxilios'],
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-CO');
}

function expiresLabel(expiresAt) {
  if (!expiresAt) return { tone: 'secondary', label: 'Sin vencimiento' };
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: 'danger', label: 'Vencido' };
  if (days <= 45) return { tone: 'warning', label: `Vence en ${days} dias` };
  return { tone: 'success', label: 'Vigente' };
}

function detectCategory(type) {
  if (categoryMap.licencias.includes(type)) return 'Licencias e identidad';
  if (categoryMap.experiencia.includes(type)) return 'Experiencia';
  if (categoryMap.formacion.includes(type)) return 'Formacion';
  if (categoryMap.cursos.includes(type)) return 'Cursos y habilitaciones';
  return 'Otros';
}

export default function ProfessionalDocuments() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'licencia_sst', fileUrl: '', expiresAt: '', status: 'active' });

  const load = () => api.get('/marketplace/professionals/me/documents').then((r) => setRows(r.data || []));
  useEffect(() => {
    load();
  }, []);

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
    if (!window.confirm('Eliminar documento?')) return;
    await api.delete(`/marketplace/professionals/me/documents/${id}`);
    load();
  };

  const groups = useMemo(() => {
    const grouped = {};
    for (const row of rows) {
      const key = detectCategory(row.type);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }
    return grouped;
  }, [rows]);

  return (
    <div>
      <h2 className="h4 mb-2">Biblioteca de documentos</h2>
      <p className="text-muted mb-3">Organiza tus soportes por categoria y mantelos actualizados para mejorar el matching.</p>

      <form className="card card-bemc p-3 mb-3 row g-2" onSubmit={createDoc}>
        <div className="col-md-3"><input className="form-control" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
        <div className="col-md-3"><select className="form-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>{Object.keys(typeLabels).map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}</select></div>
        <div className="col-md-3"><input className="form-control" placeholder="URL archivo" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required /></div>
        <div className="col-md-2"><input type="date" className="form-control" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
        <div className="col-md-1"><button className="btn btn-bemc w-100" type="submit">+</button></div>
      </form>

      {rows.length === 0 ? (
        <div className="card card-bemc p-3">
          <p className="text-muted mb-0">Aun no has cargado documentos.</p>
        </div>
      ) : (
        Object.entries(groups).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="h6 mb-2">{category}</h3>
            <div className="row g-3">
              {items.map((doc) => {
                const exp = expiresLabel(doc.expiresAt);
                return (
                  <div className="col-md-6 col-xl-4" key={doc._id}>
                    <div className="card card-bemc p-3 h-100">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <div className="fw-semibold">{doc.name}</div>
                          <div className="small text-muted">{typeLabels[doc.type] || doc.type}</div>
                        </div>
                        <span className={`badge text-bg-${doc.status === 'active' ? 'success' : doc.status === 'expired' ? 'danger' : 'secondary'}`}>{doc.status}</span>
                      </div>

                      <div className="small mb-1"><strong>Fecha de carga:</strong> {formatDate(doc.createdAt)}</div>
                      <div className="small mb-2"><strong>Vence:</strong> {formatDate(doc.expiresAt)}</div>
                      <div className="mb-3"><span className={`badge text-bg-${exp.tone}`}>{exp.label}</span></div>

                      <div className="d-flex flex-wrap gap-2 mt-auto">
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Visualizar</a>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" download className="btn btn-sm btn-outline-secondary">Descargar</a>
                        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => replaceDoc(doc)}>Reemplazar</button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDoc(doc._id)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
