import { useEffect, useState } from 'react';
import api from '../../api/client';

const areasOptions = ['Construcción', 'Industria', 'Minería', 'Petróleo', 'Energía', 'Manufactura', 'Transporte', 'Salud', 'Educación', 'Agroindustria', 'Otras'];
const servicesOptions = ['SISO por días', 'SISO tiempo completo', 'Inspector SST', 'Coordinador de Trabajo en Alturas', 'Auditor SG-SST', 'Capacitaciones', 'Investigación de accidentes', 'Elaboración de documentos SG-SST', 'Inspecciones', 'Consultoría', 'Otros'];

function csvToArray(value) {
  return (value || '').split(',').map((v) => v.trim()).filter(Boolean);
}

function arrayToCsv(value) {
  return (value || []).join(', ');
}

export default function ProfessionalProfile() {
  const [form, setForm] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, recommendations: [] });

  const load = async () => {
    const { data } = await api.get('/marketplace/professionals/me');
    const p = data?.user?.professionalProfile || {};
    const base = data?.user?.profile || {};
    setForm({
      firstName: base.firstName || '',
      lastName: base.lastName || '',
      documentType: base.documentType || '',
      documentNumber: base.documentNumber || '',
      birthDate: base.birthDate ? String(base.birthDate).slice(0, 10) : '',
      gender: base.gender || '',
      city: base.city || p.city || '',
      department: base.department || p.department || '',
      address: base.address || '',
      phone: base.phone || '',
      email: data?.user?.email || '',
      whatsapp: base.whatsapp || '',
      bio: base.bio || p.experienceSummary || '',
      avatarUrl: base.avatarUrl || '',
      mainProfession: p.mainProfession || '',
      mainRole: p.mainRole || '',
      specialty: p.specialty || '',
      yearsExperience: p.yearsExperience || 0,
      licenseNumber: p.licenseNumber || '',
      licenseIssuedAt: p.licenseIssuedAt ? String(p.licenseIssuedAt).slice(0, 10) : '',
      licenseExpiryDate: p.licenseExpiryDate ? String(p.licenseExpiryDate).slice(0, 10) : '',
      licenseStatus: p.licenseStatus || 'pending',
      areasExperience: p.areasExperience || [],
      servicesOffered: p.servicesOffered || [],
      serviceMunicipalitiesText: arrayToCsv(p.serviceMunicipalities),
      serviceDepartmentsText: arrayToCsv(p.serviceDepartments),
      canTravel: !!p.canTravel,
      immediateAvailability: !!p.immediateAvailability,
      availabilityStatus: p.availabilityStatus || 'available',
      workExperiences: p.workExperiences || [],
      educationItems: p.educationItems || [],
    });
    setCompletion(data?.completion || { percentage: 0, recommendations: [] });
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.patch('/marketplace/professionals/me', {
      profile: {
        firstName: form.firstName,
        lastName: form.lastName,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        city: form.city,
        department: form.department,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      },
      professionalProfile: {
        mainProfession: form.mainProfession,
        mainRole: form.mainRole,
        specialty: form.specialty,
        yearsExperience: Number(form.yearsExperience || 0),
        licenseNumber: form.licenseNumber,
        licenseIssuedAt: form.licenseIssuedAt || undefined,
        licenseExpiryDate: form.licenseExpiryDate || undefined,
        licenseStatus: form.licenseStatus,
        areasExperience: form.areasExperience,
        servicesOffered: form.servicesOffered,
        city: form.city,
        department: form.department,
        serviceMunicipalities: csvToArray(form.serviceMunicipalitiesText),
        serviceDepartments: csvToArray(form.serviceDepartmentsText),
        canTravel: !!form.canTravel,
        immediateAvailability: !!form.immediateAvailability,
        availabilityStatus: form.availabilityStatus,
        workExperiences: form.workExperiences,
        educationItems: form.educationItems,
        experienceSummary: form.bio,
      },
    });
    await load();
    alert('Perfil actualizado');
  };

  const addWork = () => setForm((p) => ({ ...p, workExperiences: [...p.workExperiences, { company: '', role: '', startDate: '', endDate: '', functions: '', city: '' }] }));
  const addEdu = () => setForm((p) => ({ ...p, educationItems: [...p.educationItems, { level: '', title: '', institution: '', startDate: '', endDate: '', city: '' }] }));

  if (!form) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <h2 className="h4 mb-3">Mi Perfil Profesional</h2>
      <div className="card card-bemc p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Perfil completado: {completion.percentage}%</strong>
          <div className="progress" style={{ width: 220, height: 10 }}><div className="progress-bar" style={{ width: `${completion.percentage}%` }} /></div>
        </div>
        {completion.recommendations?.length > 0 && <ul className="mb-0 small">{completion.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>}
      </div>

      <form className="card card-bemc p-3" onSubmit={save}>
        <h3 className="h6 mb-2">Información personal</h3>
        <div className="row g-2 mb-3">
          <div className="col-md-4"><input className="form-control" placeholder="Fotografía URL" value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Nombre" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Apellido" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Tipo documento" value={form.documentType} onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Número documento" value={form.documentNumber} onChange={(e) => setForm((p) => ({ ...p, documentNumber: e.target.value }))} /></div>
          <div className="col-md-3"><input type="date" className="form-control" value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Género (opcional)" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Ciudad" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Departamento" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
          <div className="col-md-6"><input className="form-control" placeholder="Dirección" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} /></div>
          <div className="col-md-6"><input className="form-control" placeholder="Correo" value={form.email} disabled /></div>
          <div className="col-12"><textarea className="form-control" rows="2" placeholder="Biografía" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></div>
        </div>

        <h3 className="h6 mb-2">Información profesional</h3>
        <div className="row g-2 mb-3">
          <div className="col-md-4"><input className="form-control" placeholder="Profesión" value={form.mainProfession} onChange={(e) => setForm((p) => ({ ...p, mainProfession: e.target.value }))} required /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Cargo principal" value={form.mainRole} onChange={(e) => setForm((p) => ({ ...p, mainRole: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control" placeholder="Especialidad" value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} /></div>
          <div className="col-md-2"><input type="number" min="0" className="form-control" placeholder="Años" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control" placeholder="Licencia SST" value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} /></div>
          <div className="col-md-2"><input type="date" className="form-control" value={form.licenseIssuedAt} onChange={(e) => setForm((p) => ({ ...p, licenseIssuedAt: e.target.value }))} /></div>
          <div className="col-md-2"><input type="date" className="form-control" value={form.licenseExpiryDate} onChange={(e) => setForm((p) => ({ ...p, licenseExpiryDate: e.target.value }))} /></div>
          <div className="col-md-3"><select className="form-select" value={form.licenseStatus} onChange={(e) => setForm((p) => ({ ...p, licenseStatus: e.target.value }))}><option value="pending">Pendiente</option><option value="valid">Vigente</option><option value="expired">Vencida</option><option value="suspended">Suspendida</option></select></div>
        </div>

        <h3 className="h6 mb-2">Áreas de experiencia</h3>
        <div className="row g-2 mb-3">{areasOptions.map((a) => <div className="col-md-3 form-check ms-2" key={a}><input type="checkbox" className="form-check-input" id={`area-${a}`} checked={form.areasExperience.includes(a)} onChange={(e) => setForm((p) => ({ ...p, areasExperience: e.target.checked ? [...p.areasExperience, a] : p.areasExperience.filter((x) => x !== a) }))} /><label className="form-check-label" htmlFor={`area-${a}`}>{a}</label></div>)}</div>

        <h3 className="h6 mb-2">Servicios que ofrece</h3>
        <div className="row g-2 mb-3">{servicesOptions.map((s) => <div className="col-md-4 form-check ms-2" key={s}><input type="checkbox" className="form-check-input" id={`srv-${s}`} checked={form.servicesOffered.includes(s)} onChange={(e) => setForm((p) => ({ ...p, servicesOffered: e.target.checked ? [...p.servicesOffered, s] : p.servicesOffered.filter((x) => x !== s) }))} /><label className="form-check-label" htmlFor={`srv-${s}`}>{s}</label></div>)}</div>

        <h3 className="h6 mb-2">Cobertura</h3>
        <div className="row g-2 mb-3">
          <div className="col-md-6"><input className="form-control" placeholder="Municipios (coma)" value={form.serviceMunicipalitiesText} onChange={(e) => setForm((p) => ({ ...p, serviceMunicipalitiesText: e.target.value }))} /></div>
          <div className="col-md-6"><input className="form-control" placeholder="Departamentos (coma)" value={form.serviceDepartmentsText} onChange={(e) => setForm((p) => ({ ...p, serviceDepartmentsText: e.target.value }))} /></div>
          <div className="col-md-3 form-check ms-2"><input type="checkbox" className="form-check-input" id="canTravel" checked={form.canTravel} onChange={(e) => setForm((p) => ({ ...p, canTravel: e.target.checked }))} /><label className="form-check-label" htmlFor="canTravel">Acepta viajar</label></div>
          <div className="col-md-3 form-check ms-2"><input type="checkbox" className="form-check-input" id="immediateAvailability" checked={form.immediateAvailability} onChange={(e) => setForm((p) => ({ ...p, immediateAvailability: e.target.checked }))} /><label className="form-check-label" htmlFor="immediateAvailability">Disponibilidad inmediata</label></div>
          <div className="col-md-4"><select className="form-select" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}><option value="available">Disponible</option><option value="busy">Ocupado</option><option value="unavailable">No disponible</option></select></div>
        </div>

        <h3 className="h6 mb-2">Experiencia laboral</h3>
        {form.workExperiences.map((w, i) => (
          <div className="row g-2 mb-2" key={`work-${i}`}>
            <div className="col-md-3"><input className="form-control" placeholder="Empresa" value={w.company || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Cargo" value={w.role || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input type="date" className="form-control" value={w.startDate ? String(w.startDate).slice(0,10) : ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input type="date" className="form-control" value={w.endDate ? String(w.endDate).slice(0,10) : ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input className="form-control" placeholder="Ciudad" value={w.city || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x) }))} /></div>
            <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" onClick={() => setForm((p) => ({ ...p, workExperiences: p.workExperiences.filter((_, idx) => idx !== i) }))}>x</button></div>
            <div className="col-12"><textarea className="form-control" rows="2" placeholder="Funciones" value={w.functions || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, functions: e.target.value } : x) }))} /></div>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={addWork}>Agregar experiencia</button>

        <h3 className="h6 mb-2">Formación académica</h3>
        {form.educationItems.map((ed, i) => (
          <div className="row g-2 mb-2" key={`edu-${i}`}>
            <div className="col-md-2"><input className="form-control" placeholder="Nivel" value={ed.level || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x) }))} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Título" value={ed.title || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) }))} /></div>
            <div className="col-md-3"><input className="form-control" placeholder="Institución" value={ed.institution || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, institution: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input type="date" className="form-control" value={ed.startDate ? String(ed.startDate).slice(0,10) : ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x) }))} /></div>
            <div className="col-md-2"><input type="date" className="form-control" value={ed.endDate ? String(ed.endDate).slice(0,10) : ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x) }))} /></div>
            <div className="col-md-11"><input className="form-control" placeholder="Ciudad" value={ed.city || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x) }))} /></div>
            <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" onClick={() => setForm((p) => ({ ...p, educationItems: p.educationItems.filter((_, idx) => idx !== i) }))}>x</button></div>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={addEdu}>Agregar formación</button>

        <div><button className="btn btn-bemc" type="submit">Guardar perfil</button></div>
      </form>
    </div>
  );
}
