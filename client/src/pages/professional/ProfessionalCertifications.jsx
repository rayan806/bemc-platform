import { useEffect, useState } from 'react';
import api from '../../api/client';

const typeLabels = {
  licencia_sst: 'Licencia SST',
  coordinador_alturas: 'Coordinador de Alturas',
  curso_50h: 'Curso 50 horas',
  curso_20h: 'Curso 20 horas',
  espacios_confinados: 'Espacios confinados',
  primeros_auxilios: 'Primeros auxilios',
  otra: 'Otra',
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-CO');
}

function getExpiryState(expiresAt) {
  if (!expiresAt) return { tone: 'secondary', label: 'Sin vencimiento' };
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: 'danger', label: 'Vencida' };
  if (days <= 45) return { tone: 'warning', label: `Vence en ${days} dias` };
  return { tone: 'success', label: 'Vigente' };
}

export default function ProfessionalCertifications() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ type: 'licencia_sst', title: '', fileUrl: '', issuedAt: '', expiresAt: '' });

  const load = () => api.get('/marketplace/professionals/me').then((r) => setRows(r.data?.certifications || []));
  useEffect(() => {
    load();
  }, []);

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

  const updateDocument = async (cert) => {
    const fileUrl = window.prompt('Nueva URL del documento', cert.fileUrl || '');
    if (!fileUrl) return;
    await api.put(`/marketplace/professionals/me/certifications/${cert._id}`, { fileUrl });
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-2">Certificaciones</h2>
      <p className="text-muted mb-3">Gestiona tus certificaciones y mantenlas actualizadas para mejorar tu visibilidad.</p>

      <form className="card card-bemc p-3 mb-3 row g-2" onSubmit={createCert}>
        <div className="col-md-3"><select className="form-select" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="col-md-3"><input className="form-control" placeholder="Nombre de certificacion" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
        <div className="col-md-3"><input className="form-control" placeholder="URL documento" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required /></div>
        <div className="col-md-1"><input type="date" className="form-control" value={form.issuedAt} onChange={(e) => setForm((p) => ({ ...p, issuedAt: e.target.value }))} /></div>
        <div className="col-md-1"><input type="date" className="form-control" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
        <div className="col-md-1"><button className="btn btn-bemc w-100" type="submit">+</button></div>
      </form>

      <div className="row g-3">
        {rows.length === 0 ? (
          <div className="col-12">
            <div className="card card-bemc p-3">
              <p className="text-muted mb-0">Aun no tienes certificaciones registradas.</p>
            </div>
          </div>
        ) : rows.map((cert) => {
          const expiry = getExpiryState(cert.expiresAt);
          return (
            <div className="col-md-6 col-xl-4" key={cert._id}>
              <div className="card card-bemc p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                  <div>
                    <div className="fw-semibold">{cert.title}</div>
                    <div className="small text-muted">{typeLabels[cert.type] || cert.type}</div>
                  </div>
                  <span className={`badge text-bg-${cert.isVerified ? 'success' : 'secondary'}`}>{cert.isVerified ? 'Verificada' : 'Pendiente'}</span>
                </div>

                <div className="small mb-1"><strong>Expedicion:</strong> {formatDate(cert.issuedAt)}</div>
                <div className="small mb-2"><strong>Vencimiento:</strong> {formatDate(cert.expiresAt)}</div>
                <div className="mb-3"><span className={`badge text-bg-${expiry.tone}`}>{expiry.label}</span></div>

                <div className="d-flex flex-wrap gap-2 mt-auto">
                  <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">Ver documento</a>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => updateDocument(cert)}>Actualizar documento</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
