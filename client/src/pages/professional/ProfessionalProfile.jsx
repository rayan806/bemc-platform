import { useEffect, useState } from 'react';
import api from '../../api/client';

const areasOptions = ['Construccion', 'Industria', 'Mineria', 'Petroleo', 'Energia', 'Manufactura', 'Transporte', 'Salud', 'Educacion', 'Agroindustria', 'Otras'];
const servicesOptions = ['SISO por dias', 'SISO tiempo completo', 'Inspector SST', 'Coordinador de Trabajo en Alturas', 'Auditor SG-SST', 'Capacitaciones', 'Investigacion de accidentes', 'Elaboracion de documentos SG-SST', 'Inspecciones', 'Consultoria', 'Otros'];
const expectedCertificationTypes = ['licencia_sst', 'coordinador_alturas', 'curso_50h', 'curso_20h', 'espacios_confinados', 'primeros_auxilios', 'otra'];

const textFixes = {
  'Construcci�n': 'Construccion',
  'Miner�a': 'Mineria',
  'Petr�leo': 'Petroleo',
  'Educaci�n': 'Educacion',
  'SISO por d�as': 'SISO por dias',
  'Consultor�a': 'Consultoria',
  'Investigaci�n de accidentes': 'Investigacion de accidentes',
  'Especializaci�n': 'Especializacion',
};

function normalizeCorruptedText(value) {
  if (!value) return '';
  const text = String(value).trim();
  return textFixes[text] || text;
}

function normalizeArray(values) {
  return (values || []).map((v) => normalizeCorruptedText(v)).filter(Boolean);
}

function csvToArray(value) {
  return (value || '').split(',').map((v) => v.trim()).filter(Boolean);
}

function arrayToCsv(value) {
  return (value || []).join(', ');
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-CO');
}

function licenseWarning(expiryDate) {
  if (!expiryDate) return { tone: 'secondary', label: 'Sin fecha de vencimiento' };
  const now = Date.now();
  const expiry = new Date(expiryDate).getTime();
  const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: 'danger', label: 'Licencia vencida' };
  if (days <= 45) return { tone: 'warning', label: `Vence en ${days} dias` };
  return { tone: 'success', label: 'Licencia al dia' };
}

function expiringCount(items, days = 45) {
  const now = Date.now();
  const limit = now + days * 24 * 60 * 60 * 1000;
  return (items || []).filter((item) => {
    if (!item?.expiresAt) return false;
    const ts = new Date(item.expiresAt).getTime();
    return ts >= now && ts <= limit;
  }).length;
}

export default function ProfessionalProfile() {
  const [form, setForm] = useState(null);
  const [completion, setCompletion] = useState({ percentage: 0, recommendations: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [documents, setDocuments] = useState([]);

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
      areasExperience: normalizeArray(p.areasExperience),
      servicesOffered: normalizeArray(p.servicesOffered),
      serviceMunicipalitiesText: arrayToCsv(p.serviceMunicipalities),
      serviceDepartmentsText: arrayToCsv(p.serviceDepartments),
      canTravel: !!p.canTravel,
      immediateAvailability: !!p.immediateAvailability,
      availabilityStatus: p.availabilityStatus || 'available',
      workExperiences: p.workExperiences || [],
      educationItems: (p.educationItems || []).map((ed) => ({
        ...ed,
        level: normalizeCorruptedText(ed?.level),
      })),
      ratingAvg: Number(p.ratingAvg || 0),
      completedServicesCount: Number(p.completedServicesCount || 0),
    });
    setCompletion(data?.completion || { percentage: 0, recommendations: [] });
    setCertifications(data?.certifications || []);
    setDocuments(data?.documents || []);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
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
          areasExperience: normalizeArray(form.areasExperience),
          servicesOffered: normalizeArray(form.servicesOffered),
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
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const addWork = () => setForm((p) => ({ ...p, workExperiences: [...p.workExperiences, { company: '', role: '', startDate: '', endDate: '', functions: '', city: '' }] }));
  const addEdu = () => setForm((p) => ({ ...p, educationItems: [...p.educationItems, { level: '', title: '', institution: '', startDate: '', endDate: '', city: '' }] }));

  const headerStatusLabel = form?.availabilityStatus === 'available' ? 'Disponible' : form?.availabilityStatus === 'busy' ? 'Ocupado' : 'No disponible';
  const licenseAlert = licenseWarning(form?.licenseExpiryDate);
  const expiringDocs = expiringCount(documents, 45);
  const expiringCerts = expiringCount(certifications, 45);
  const certificationLoadedTypes = new Set((certifications || []).map((c) => c.type));

  if (!form) return <div className="spinner-border text-primary" />;

  return (
    <div>
      <div className="card card-bemc p-3 p-lg-4 mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-start justify-content-between">
          <div className="d-flex gap-3 align-items-center">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="foto profesional" width="92" height="92" className="rounded-3 border" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="rounded-3 border bg-light d-flex align-items-center justify-content-center" style={{ width: 92, height: 92 }}>
                <strong className="text-muted">{(form.firstName || 'P').charAt(0).toUpperCase()}</strong>
              </div>
            )}
            <div>
              <h2 className="h4 mb-1">{form.firstName} {form.lastName}</h2>
              <div className="text-muted">{form.mainProfession || 'Profesional SST'} · {form.specialty || 'Especialidad no definida'}</div>
              <div className="small text-muted">{form.city || 'Ciudad'} · {form.department || 'Departamento'} · {headerStatusLabel}</div>
            </div>
          </div>
          <div className="d-flex gap-2">
            {!isEditing ? (
              <button type="button" className="btn btn-bemc btn-sm" onClick={() => setIsEditing(true)}>Editar perfil</button>
            ) : (
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancelar edición</button>
            )}
          </div>
        </div>

        <div className="row g-2 mt-3">
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{form.ratingAvg || 0}</strong><span>Calificación</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{form.completedServicesCount || 0}</strong><span>Servicios</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{completion.percentage}%</strong><span>Perfil completado</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{certifications.length}</strong><span>Certificaciones</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{documents.length}</strong><span>Documentos</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{expiringDocs + expiringCerts}</strong><span>Proximos a vencer</span></div></div>
        </div>

        <div className="progress mt-3" style={{ height: 10 }}>
          <div className={`progress-bar ${completion.percentage >= 85 ? 'bg-success' : completion.percentage >= 60 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${completion.percentage}%` }} />
        </div>
      </div>

      {!isEditing ? (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Informacion personal</h3>
              <div className="small"><strong>Nombre:</strong> {form.firstName} {form.lastName}</div>
              <div className="small"><strong>Documento:</strong> {form.documentType || 'N/D'} {form.documentNumber || 'N/D'}</div>
              <div className="small"><strong>Telefono:</strong> {form.phone || 'N/D'}</div>
              <div className="small"><strong>WhatsApp:</strong> {form.whatsapp || 'N/D'}</div>
              <div className="small"><strong>Correo:</strong> {form.email || 'N/D'}</div>
              <div className="small"><strong>Ciudad:</strong> {form.city || 'N/D'}</div>
              <div className="small"><strong>Direccion:</strong> {form.address || 'N/D'}</div>
              <p className="small text-muted mt-2 mb-0">{form.bio || 'Sin biografia registrada.'}</p>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Informacion profesional</h3>
              <div className="small"><strong>Profesion:</strong> {form.mainProfession || 'N/D'}</div>
              <div className="small"><strong>Cargo principal:</strong> {form.mainRole || 'N/D'}</div>
              <div className="small"><strong>Especialidad:</strong> {form.specialty || 'N/D'}</div>
              <div className="small"><strong>Experiencia:</strong> {form.yearsExperience || 0} anos</div>
              <div className="small"><strong>Licencia SST:</strong> {form.licenseNumber || 'N/D'}</div>
              <div className="small"><strong>Expedicion:</strong> {formatDate(form.licenseIssuedAt)}</div>
              <div className="small"><strong>Vencimiento:</strong> {formatDate(form.licenseExpiryDate)}</div>
              <div className="mt-2">
                <span className={`badge text-bg-${licenseAlert.tone}`}>{licenseAlert.label}</span>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Servicios que ofrece</h3>
              <div className="d-flex flex-wrap gap-2">
                {form.servicesOffered.length === 0 ? <span className="text-muted small">Sin servicios registrados</span> : form.servicesOffered.map((item) => <span key={item} className="profile-chip">{item}</span>)}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Areas de experiencia</h3>
              <div className="d-flex flex-wrap gap-2">
                {form.areasExperience.length === 0 ? <span className="text-muted small">Sin areas registradas</span> : form.areasExperience.map((item) => <span key={item} className="profile-chip profile-chip-soft">{item}</span>)}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Cobertura</h3>
              <div className="row g-2 small">
                <div className="col-md-4"><strong>Ciudad principal:</strong> {form.city || 'N/D'}</div>
                <div className="col-md-4"><strong>Municipios:</strong> {form.serviceMunicipalitiesText || 'N/D'}</div>
                <div className="col-md-4"><strong>Departamentos:</strong> {form.serviceDepartmentsText || 'N/D'}</div>
                <div className="col-md-4"><strong>Acepta viajar:</strong> {form.canTravel ? 'Si' : 'No'}</div>
                <div className="col-md-4"><strong>Disponibilidad inmediata:</strong> {form.immediateAvailability ? 'Si' : 'No'}</div>
                <div className="col-md-4"><strong>Estado:</strong> {headerStatusLabel}</div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-3">Experiencia laboral</h3>
              {form.workExperiences.length === 0 ? (
                <p className="text-muted small mb-0">No hay experiencia registrada.</p>
              ) : (
                <div className="timeline-list">
                  {form.workExperiences.map((work, index) => (
                    <div key={`work-${index}`} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-card">
                        <div className="fw-semibold">{work.company || 'Empresa'} · {work.role || 'Cargo'}</div>
                        <div className="small text-muted">{work.city || 'Ciudad'} · {formatDate(work.startDate)} - {work.endDate ? formatDate(work.endDate) : 'Actual'}</div>
                        <p className="small mb-0 mt-1">{work.functions || 'Sin descripcion de funciones.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-3">Formacion academica</h3>
              {form.educationItems.length === 0 ? (
                <p className="text-muted small mb-0">No hay formacion registrada.</p>
              ) : (
                <div className="row g-2">
                  {form.educationItems.map((ed, index) => (
                    <div className="col-md-6 col-xl-4" key={`ed-${index}`}>
                      <div className="border rounded p-2 h-100 bg-white">
                        <div className="fw-semibold">{ed.level || 'Nivel no definido'}</div>
                        <div className="small">{ed.title || 'Titulo no definido'}</div>
                        <div className="small text-muted">{ed.institution || 'Institucion no definida'}</div>
                        <div className="small text-muted mt-1">{formatDate(ed.startDate)} - {ed.endDate ? formatDate(ed.endDate) : 'Actual'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Progreso y validacion</h3>
              <div className="row g-2 small">
                <div className="col-md-3"><strong>Perfil:</strong> {completion.percentage}%</div>
                <div className="col-md-3"><strong>Licencia SST:</strong> {form.licenseStatus === 'valid' ? 'Verificada' : 'Pendiente'}</div>
                <div className="col-md-3"><strong>Certificaciones:</strong> {certificationLoadedTypes.size} de {expectedCertificationTypes.length} cargadas</div>
                <div className="col-md-3"><strong>Experiencia/Formacion:</strong> {form.workExperiences.length > 0 && form.educationItems.length > 0 ? 'Completa' : 'Incompleta'}</div>
              </div>
              {completion.recommendations?.length > 0 && (
                <ul className="small mb-0 mt-2">
                  {completion.recommendations.map((rec) => <li key={rec}>{rec}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form className="row g-3" onSubmit={save}>
          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Informacion personal</h3>
              <div className="row g-2">
                <div className="col-md-4"><input className="form-control" placeholder="Fotografia URL" value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} /></div>
                <div className="col-md-4"><input className="form-control" placeholder="Nombre" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
                <div className="col-md-4"><input className="form-control" placeholder="Apellido" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Tipo documento" value={form.documentType} onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Numero documento" value={form.documentNumber} onChange={(e) => setForm((p) => ({ ...p, documentNumber: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Ciudad" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Departamento" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
                <div className="col-md-6"><input className="form-control" placeholder="Direccion" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
                <div className="col-12"><textarea className="form-control" rows="2" placeholder="Biografia" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} /></div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Informacion profesional</h3>
              <div className="row g-2">
                <div className="col-md-4"><input className="form-control" placeholder="Profesion" value={form.mainProfession} onChange={(e) => setForm((p) => ({ ...p, mainProfession: e.target.value }))} required /></div>
                <div className="col-md-4"><input className="form-control" placeholder="Cargo principal" value={form.mainRole} onChange={(e) => setForm((p) => ({ ...p, mainRole: e.target.value }))} /></div>
                <div className="col-md-4"><input className="form-control" placeholder="Especialidad" value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} /></div>
                <div className="col-md-2"><input type="number" min="0" className="form-control" placeholder="Anios" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Licencia SST" value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))} /></div>
                <div className="col-md-2"><input type="date" className="form-control" value={form.licenseIssuedAt} onChange={(e) => setForm((p) => ({ ...p, licenseIssuedAt: e.target.value }))} /></div>
                <div className="col-md-2"><input type="date" className="form-control" value={form.licenseExpiryDate} onChange={(e) => setForm((p) => ({ ...p, licenseExpiryDate: e.target.value }))} /></div>
                <div className="col-md-3"><select className="form-select" value={form.licenseStatus} onChange={(e) => setForm((p) => ({ ...p, licenseStatus: e.target.value }))}><option value="pending">Pendiente</option><option value="valid">Vigente</option><option value="expired">Vencida</option><option value="suspended">Suspendida</option></select></div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Servicios que ofrece</h3>
              <div className="row g-2">
                {servicesOptions.map((s) => (
                  <div className="col-12" key={s}>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id={`srv-${s}`} checked={form.servicesOffered.includes(s)} onChange={(e) => setForm((p) => ({ ...p, servicesOffered: e.target.checked ? [...p.servicesOffered, s] : p.servicesOffered.filter((x) => x !== s) }))} />
                      <label className="form-check-label" htmlFor={`srv-${s}`}>{s}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card card-bemc p-3 h-100">
              <h3 className="h6 mb-2">Areas de experiencia</h3>
              <div className="row g-2">
                {areasOptions.map((a) => (
                  <div className="col-12" key={a}>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id={`area-${a}`} checked={form.areasExperience.includes(a)} onChange={(e) => setForm((p) => ({ ...p, areasExperience: e.target.checked ? [...p.areasExperience, a] : p.areasExperience.filter((x) => x !== a) }))} />
                      <label className="form-check-label" htmlFor={`area-${a}`}>{a}</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Cobertura y disponibilidad</h3>
              <div className="row g-2">
                <div className="col-md-6"><input className="form-control" placeholder="Municipios (coma)" value={form.serviceMunicipalitiesText} onChange={(e) => setForm((p) => ({ ...p, serviceMunicipalitiesText: e.target.value }))} /></div>
                <div className="col-md-6"><input className="form-control" placeholder="Departamentos (coma)" value={form.serviceDepartmentsText} onChange={(e) => setForm((p) => ({ ...p, serviceDepartmentsText: e.target.value }))} /></div>
                <div className="col-md-3"><select className="form-select" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}><option value="available">Disponible</option><option value="busy">Ocupado</option><option value="unavailable">No disponible</option></select></div>
                <div className="col-md-3 form-check ms-2"><input type="checkbox" className="form-check-input" id="canTravel" checked={form.canTravel} onChange={(e) => setForm((p) => ({ ...p, canTravel: e.target.checked }))} /><label className="form-check-label" htmlFor="canTravel">Acepta viajar</label></div>
                <div className="col-md-3 form-check ms-2"><input type="checkbox" className="form-check-input" id="immediateAvailability" checked={form.immediateAvailability} onChange={(e) => setForm((p) => ({ ...p, immediateAvailability: e.target.checked }))} /><label className="form-check-label" htmlFor="immediateAvailability">Disponibilidad inmediata</label></div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Experiencia laboral</h3>
              {form.workExperiences.map((w, i) => (
                <div className="row g-2 mb-2" key={`work-${i}`}>
                  <div className="col-md-3"><input className="form-control" placeholder="Empresa" value={w.company || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input className="form-control" placeholder="Cargo" value={w.role || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input type="date" className="form-control" value={w.startDate ? String(w.startDate).slice(0, 10) : ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input type="date" className="form-control" value={w.endDate ? String(w.endDate).slice(0, 10) : ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input className="form-control" placeholder="Ciudad" value={w.city || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x) }))} /></div>
                  <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" onClick={() => setForm((p) => ({ ...p, workExperiences: p.workExperiences.filter((_, idx) => idx !== i) }))}>x</button></div>
                  <div className="col-12"><textarea className="form-control" rows="2" placeholder="Funciones" value={w.functions || ''} onChange={(e) => setForm((p) => ({ ...p, workExperiences: p.workExperiences.map((x, idx) => idx === i ? { ...x, functions: e.target.value } : x) }))} /></div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addWork}>Agregar experiencia</button>
            </div>
          </div>

          <div className="col-12">
            <div className="card card-bemc p-3">
              <h3 className="h6 mb-2">Formacion academica</h3>
              {form.educationItems.map((ed, i) => (
                <div className="row g-2 mb-2" key={`edu-${i}`}>
                  <div className="col-md-2"><input className="form-control" placeholder="Nivel" value={ed.level || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x) }))} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="Titulo" value={ed.title || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) }))} /></div>
                  <div className="col-md-3"><input className="form-control" placeholder="Institucion" value={ed.institution || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, institution: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input type="date" className="form-control" value={ed.startDate ? String(ed.startDate).slice(0, 10) : ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x) }))} /></div>
                  <div className="col-md-2"><input type="date" className="form-control" value={ed.endDate ? String(ed.endDate).slice(0, 10) : ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x) }))} /></div>
                  <div className="col-md-11"><input className="form-control" placeholder="Ciudad" value={ed.city || ''} onChange={(e) => setForm((p) => ({ ...p, educationItems: p.educationItems.map((x, idx) => idx === i ? { ...x, city: e.target.value } : x) }))} /></div>
                  <div className="col-md-1"><button type="button" className="btn btn-outline-danger w-100" onClick={() => setForm((p) => ({ ...p, educationItems: p.educationItems.filter((_, idx) => idx !== i) }))}>x</button></div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addEdu}>Agregar formacion</button>
            </div>
          </div>

          <div className="col-12 d-flex gap-2">
            <button className="btn btn-bemc" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar perfil'}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
