import { useEffect, useState } from 'react';
import api from '../../api/client';

function toText(arr, mapFn) {
  return (arr || []).map(mapFn).join('\n');
}

export default function ProfessionalProfile() {
  const [form, setForm] = useState(null);
  const [certs, setCerts] = useState([]);
  const [certForm, setCertForm] = useState({ type: 'licencia_sst', title: '', fileUrl: '' });

  useEffect(() => {
    api.get('/marketplace/professionals/me').then((r) => {
      const p = r.data?.user?.professionalProfile || {};
      const base = r.data?.user?.profile || {};
      setForm({
        avatarUrl: base.avatarUrl || '',
        mainProfession: p.mainProfession || '',
        yearsExperience: p.yearsExperience || 0,
        experienceSummary: p.experienceSummary || '',
        studiesText: toText(p.studies, (s) => `${s.title || ''}|${s.institution || ''}|${s.year || ''}`),
        licensesText: toText(p.licenses, (l) => `${l.name || ''}|${l.number || ''}|${l.expiryDate ? String(l.expiryDate).slice(0, 10) : ''}`),
        specialtiesText: (p.specialties || []).join(', '),
        serviceMunicipalitiesText: (p.serviceMunicipalities || []).join(', '),
        availabilityStatus: p.availabilityStatus || 'available',
      });
      setCerts(r.data?.certifications || []);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.patch('/marketplace/professionals/me', {
      profile: { avatarUrl: form.avatarUrl },
      professionalProfile: {
        mainProfession: form.mainProfession,
        yearsExperience: Number(form.yearsExperience || 0),
        experienceSummary: form.experienceSummary,
        studies: form.studiesText.split('\n').map((x) => x.trim()).filter(Boolean).map((row) => {
          const [title = '', institution = '', year = ''] = row.split('|').map((v) => v.trim());
          return { title, institution, year: year ? Number(year) : undefined };
        }),
        licenses: form.licensesText.split('\n').map((x) => x.trim()).filter(Boolean).map((row) => {
          const [name = '', number = '', expiryDate = ''] = row.split('|').map((v) => v.trim());
          return { name, number, expiryDate: expiryDate || undefined };
        }),
        specialties: form.specialtiesText.split(',').map((x) => x.trim()).filter(Boolean),
        serviceMunicipalities: form.serviceMunicipalitiesText.split(',').map((x) => x.trim()).filter(Boolean),
        availabilityStatus: form.availabilityStatus,
      },
    });
    alert('Perfil actualizado');
  };

  const addCert = async (e) => {
    e.preventDefault();
    await api.post('/marketplace/professionals/me/certifications', certForm);
    const { data } = await api.get('/marketplace/professionals/me');
    setCerts(data.certifications || []);
    setCertForm({ type: 'licencia_sst', title: '', fileUrl: '' });
  };

  if (!form) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h2 className="h4 mb-3">Mi Perfil Profesional</h2>
      <form className="row g-2 mb-4" onSubmit={save}>
        <div className="col-md-4"><input className="form-control" placeholder="Foto URL" value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Profesion" value={form.mainProfession} onChange={(e) => setForm((p) => ({ ...p, mainProfession: e.target.value }))} required /></div>
        <div className="col-md-2"><input type="number" className="form-control" min="0" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} /></div>
        <div className="col-md-2"><select className="form-select" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}><option value="available">Disponible</option><option value="busy">Ocupado</option><option value="unavailable">No disponible</option></select></div>
        <div className="col-12"><textarea className="form-control" rows="2" placeholder="Experiencia" value={form.experienceSummary} onChange={(e) => setForm((p) => ({ ...p, experienceSummary: e.target.value }))} /></div>
        <div className="col-12"><textarea className="form-control" rows="2" placeholder="Estudios (titulo|institucion|anio)" value={form.studiesText} onChange={(e) => setForm((p) => ({ ...p, studiesText: e.target.value }))} /></div>
        <div className="col-12"><textarea className="form-control" rows="2" placeholder="Licencias (nombre|numero|fecha)" value={form.licensesText} onChange={(e) => setForm((p) => ({ ...p, licensesText: e.target.value }))} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Especialidades (coma)" value={form.specialtiesText} onChange={(e) => setForm((p) => ({ ...p, specialtiesText: e.target.value }))} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Ciudades (coma)" value={form.serviceMunicipalitiesText} onChange={(e) => setForm((p) => ({ ...p, serviceMunicipalitiesText: e.target.value }))} /></div>
        <div className="col-12"><button className="btn btn-bemc btn-sm" type="submit">Guardar</button></div>
      </form>

      <div className="card card-bemc p-3">
        <h3 className="h6">Certificaciones</h3>
        <form className="row g-2 mb-3" onSubmit={addCert}>
          <div className="col-md-3"><select className="form-select" value={certForm.type} onChange={(e) => setCertForm((p) => ({ ...p, type: e.target.value }))}><option value="licencia_sst">Licencia SST</option><option value="coordinador_alturas">Coordinador alturas</option><option value="curso_50h">Curso 50h</option><option value="curso_20h">Curso 20h</option><option value="espacios_confinados">Espacios confinados</option><option value="primeros_auxilios">Primeros auxilios</option><option value="otra">Otra</option></select></div>
          <div className="col-md-4"><input className="form-control" placeholder="Titulo" required value={certForm.title} onChange={(e) => setCertForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="URL" required value={certForm.fileUrl} onChange={(e) => setCertForm((p) => ({ ...p, fileUrl: e.target.value }))} /></div>
          <div className="col-md-1"><button className="btn btn-outline-primary w-100" type="submit">+</button></div>
        </form>
        <ul className="mb-0">{certs.map((c) => <li key={c._id}>{c.title} ({c.type})</li>)}</ul>
      </div>
    </div>
  );
}
