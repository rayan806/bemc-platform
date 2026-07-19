/**
 * Archivo: client/src/pages/portal/PortalMarketplace.jsx
 * Proposito: Modulo Marketplace SST para empresas y profesionales.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const requestStatuses = {
  draft: 'Borrador',
  published: 'Publicada',
  in_postulation: 'En postulacion',
  professional_selected: 'Profesional seleccionado',
  in_execution: 'En ejecucion',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
};

const assignmentStatuses = {
  assigned: 'Asignada',
  in_execution: 'En ejecucion',
  finished: 'Finalizada',
  cancelled: 'Cancelada',
};

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function parseCsv(text) {
  return (text || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseStudies(text) {
  return (text || '')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [title = '', institution = '', year = ''] = row.split('|').map((v) => v.trim());
      return { title, institution, year: year ? Number(year) : undefined };
    })
    .filter((s) => s.title);
}

function parseLicenses(text) {
  return (text || '')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [name = '', number = '', expiryDate = ''] = row.split('|').map((v) => v.trim());
      return { name, number, expiryDate: expiryDate || undefined };
    })
    .filter((l) => l.name || l.number);
}

function studiesToText(studies) {
  return (studies || [])
    .map((s) => `${s.title || ''}|${s.institution || ''}|${s.year || ''}`)
    .join('\n');
}

function licensesToText(licenses) {
  return (licenses || [])
    .map((l) => `${l.name || ''}|${l.number || ''}|${l.expiryDate ? String(l.expiryDate).slice(0, 10) : ''}`)
    .join('\n');
}

function StatusBadge({ value, map }) {
  return <span className="badge bg-light text-dark border">{map[value] || value}</span>;
}

export default function PortalMarketplace() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);

  const [applicationsByRequest, setApplicationsByRequest] = useState({});
  const [reportsByAssignment, setReportsByAssignment] = useState({});
  const [ratingsByAssignment, setRatingsByAssignment] = useState({});

  const [professionalProfile, setProfessionalProfile] = useState({
    mainProfession: '',
    mainRole: '',
    yearsExperience: 0,
    experienceSummary: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    specialtiesText: '',
    city: '',
    department: '',
    serviceMunicipalitiesText: '',
    availabilityStatus: 'available',
    canTravel: false,
    avatarUrl: '',
    studiesText: '',
    licensesText: '',
  });

  const [certForm, setCertForm] = useState({
    type: 'licencia_sst',
    title: '',
    fileUrl: '',
    issuedAt: '',
    expiresAt: '',
  });
  const [myCertifications, setMyCertifications] = useState([]);

  const [form, setForm] = useState({
    contactName: user?.profile?.firstName || '',
    contactPhone: user?.profile?.phone || '',
    contactEmail: user?.email || '',
    city: '',
    department: '',
    startDate: '',
    estimatedEndDate: '',
    requiredProfessionalType: '',
    requiredService: '',
    minYearsExperience: 0,
    workersCount: 1,
    riskLevel: 'medio',
    description: '',
    requiresWorkingAtHeights: false,
    requiresConfinedSpaces: false,
    requiresImmediateAvailability: false,
    requiredSpecialtiesText: '',
    attachmentsText: '',
    publishNow: true,
  });

  const isProfessional = user?.role === 'professional_sst';
  const isCompanyClient = user?.role === 'client' && user?.accountType === 'company';
  const canUseMarketplace = isProfessional || isCompanyClient || user?.role === 'admin';

  const refresh = async () => {
    setError('');
    try {
      if (isProfessional) {
        const [summaryRes, opportunitiesRes, applicationsRes, assignmentsRes, meRes, historyRes] =
          await Promise.all([
            api.get('/marketplace/summary'),
            api.get('/marketplace/opportunities'),
            api.get('/marketplace/applications/mine'),
            api.get('/marketplace/assignments'),
            api.get('/marketplace/professionals/me'),
            api.get('/marketplace/history'),
          ]);

        setSummary(summaryRes.data);
        setOpportunities(opportunitiesRes.data || []);
        setMyApplications(applicationsRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setHistory(historyRes.data || []);

        const p = meRes.data?.user?.professionalProfile || {};
        const baseProfile = meRes.data?.user?.profile || {};
        setProfessionalProfile({
          mainProfession: p.mainProfession || '',
          mainRole: p.mainRole || '',
          yearsExperience: p.yearsExperience || 0,
          experienceSummary: p.experienceSummary || '',
          licenseNumber: p.licenseNumber || '',
          licenseExpiryDate: p.licenseExpiryDate ? String(p.licenseExpiryDate).slice(0, 10) : '',
          specialtiesText: (p.specialties || []).join(', '),
          city: p.city || '',
          department: p.department || '',
          serviceMunicipalitiesText: (p.serviceMunicipalities || []).join(', '),
          availabilityStatus: p.availabilityStatus || 'available',
          canTravel: !!p.canTravel,
          avatarUrl: baseProfile.avatarUrl || '',
          studiesText: studiesToText(p.studies),
          licensesText: licensesToText(p.licenses),
        });
        setMyCertifications(meRes.data?.certifications || []);
      } else {
        const [requestsRes, assignmentsRes, historyRes] = await Promise.all([
          api.get('/marketplace/requests'),
          api.get('/marketplace/assignments'),
          api.get('/marketplace/history'),
        ]);
        setRequests(requestsRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setHistory(historyRes.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar Marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const myApplicationRequestIds = useMemo(
    () => new Set(myApplications.map((a) => a.request?._id || a.request)),
    [myApplications]
  );

  const createRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/marketplace/requests', {
        ...form,
        workersCount: Number(form.workersCount),
        requiredSpecialties: parseCsv(form.requiredSpecialtiesText),
        attachments: (form.attachmentsText || '')
          .split('\n')
          .map((row) => row.trim())
          .filter(Boolean),
      });
      setForm({
        contactName: user?.profile?.firstName || '',
        contactPhone: user?.profile?.phone || '',
        contactEmail: user?.email || '',
        city: '',
        department: '',
        startDate: '',
        estimatedEndDate: '',
        requiredProfessionalType: '',
        requiredService: '',
        minYearsExperience: 0,
        workersCount: 1,
        riskLevel: 'medio',
        description: '',
        requiresWorkingAtHeights: false,
        requiresConfinedSpaces: false,
        requiresImmediateAvailability: false,
        requiredSpecialtiesText: '',
        attachmentsText: '',
        publishNow: true,
      });
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la solicitud');
    }
  };

  const applyToOpportunity = async (requestId) => {
    const economicProposal = window.prompt('Ingresa tu propuesta economica en COP:');
    if (!economicProposal) return;
    const availabilityNote = window.prompt('Escribe tu disponibilidad para iniciar (opcional):') || '';
    const observations = window.prompt('Mensaje/propuesta para la empresa (opcional):') || '';

    try {
      await api.post(`/marketplace/requests/${requestId}/applications`, {
        economicProposal: Number(economicProposal),
        availabilityNote,
        observations,
      });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo postular');
    }
  };

  const saveProfessionalData = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/marketplace/professionals/me', {
        profile: {
          avatarUrl: professionalProfile.avatarUrl,
        },
        professionalProfile: {
          mainProfession: professionalProfile.mainProfession,
          mainRole: professionalProfile.mainRole,
          yearsExperience: Number(professionalProfile.yearsExperience || 0),
          experienceSummary: professionalProfile.experienceSummary,
          licenseNumber: professionalProfile.licenseNumber,
          licenseExpiryDate: professionalProfile.licenseExpiryDate || undefined,
          specialties: parseCsv(professionalProfile.specialtiesText),
          city: professionalProfile.city,
          department: professionalProfile.department,
          serviceMunicipalities: parseCsv(professionalProfile.serviceMunicipalitiesText),
          canTravel: !!professionalProfile.canTravel,
          availabilityStatus: professionalProfile.availabilityStatus,
          studies: parseStudies(professionalProfile.studiesText),
          licenses: parseLicenses(professionalProfile.licensesText),
        },
      });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo guardar el perfil');
    }
  };

  const addCertification = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/professionals/me/certifications', {
        type: certForm.type,
        title: certForm.title,
        fileUrl: certForm.fileUrl,
        issuedAt: certForm.issuedAt || undefined,
        expiresAt: certForm.expiresAt || undefined,
      });
      setCertForm({
        type: 'licencia_sst',
        title: '',
        fileUrl: '',
        issuedAt: '',
        expiresAt: '',
      });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo registrar la certificacion');
    }
  };

  const loadApplications = async (requestId) => {
    try {
      const { data } = await api.get(`/marketplace/requests/${requestId}/applications`);
      setApplicationsByRequest((prev) => ({ ...prev, [requestId]: data || [] }));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudieron cargar postulaciones');
    }
  };

  const selectProfessional = async (requestId, professionalId) => {
    const agreedValue = window.prompt('Valor acordado en COP:');
    if (!agreedValue) return;

    try {
      await api.post(`/marketplace/requests/${requestId}/select`, {
        professionalId,
        agreedValue: Number(agreedValue),
      });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo seleccionar profesional');
    }
  };

  const updateAssignmentStatus = async (assignmentId, status) => {
    try {
      await api.patch(`/marketplace/assignments/${assignmentId}/status`, { status });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo actualizar el estado');
    }
  };

  const decideAssignment = async (assignmentId, decision) => {
    const reason = decision === 'rejected' ? window.prompt('Motivo de rechazo (opcional):') || '' : '';
    try {
      await api.post(`/marketplace/assignments/${assignmentId}/decision`, { decision, reason });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo registrar la decision');
    }
  };

  const loadReports = async (assignmentId) => {
    try {
      const { data } = await api.get(`/marketplace/assignments/${assignmentId}/reports`);
      setReportsByAssignment((prev) => ({ ...prev, [assignmentId]: data || [] }));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudieron cargar los reportes');
    }
  };

  const createReport = async (assignmentId) => {
    const activities = window.prompt('Actividades realizadas:');
    if (!activities) return;
    const workedHours = window.prompt('Horas trabajadas:');
    if (!workedHours) return;
    const observations = window.prompt('Observaciones (opcional):') || '';
    const evidencePhotosRaw = window.prompt('URLs de evidencias (separadas por coma, opcional):') || '';

    try {
      await api.post(`/marketplace/assignments/${assignmentId}/reports`, {
        reportDate: new Date().toISOString(),
        activities,
        workedHours: Number(workedHours),
        observations,
        evidencePhotos: parseCsv(evidencePhotosRaw),
      });
      loadReports(assignmentId);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo crear el reporte');
    }
  };

  const loadRatings = async (assignmentId) => {
    try {
      const { data } = await api.get(`/marketplace/assignments/${assignmentId}/ratings`);
      setRatingsByAssignment((prev) => ({ ...prev, [assignmentId]: data || [] }));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudieron cargar las calificaciones');
    }
  };

  const rateAssignment = async (assignmentId) => {
    const score = window.prompt('Calificacion (1 a 5):');
    if (!score) return;
    const comment = window.prompt('Comentario (opcional):') || '';

    try {
      await api.post(`/marketplace/assignments/${assignmentId}/ratings`, {
        score: Number(score),
        comment,
      });
      loadRatings(assignmentId);
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo registrar la calificacion');
    }
  };

  const viewFinalArtifact = async (assignmentId, type) => {
    try {
      const endpoint = type === 'certificate' ? 'certificate' : 'final-report';
      const { data } = await api.get(`/marketplace/assignments/${assignmentId}/${endpoint}`);
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo consultar el documento final');
    }
  };

  if (loading) return <div className="spinner-border text-primary" />;

  if (!canUseMarketplace) {
    return (
      <div className="card card-bemc p-4">
        <h1 className="h4">Marketplace SST</h1>
        <p className="text-muted mb-0">Esta seccion esta disponible para empresas y profesionales SST.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Marketplace SST</h1>
        <small className="text-muted">Conecta empresas y profesionales SST</small>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isProfessional ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3"><div className="stat-card"><div className="stat-value">{summary?.activeApplications || 0}</div><div className="stat-label">Postulaciones activas</div></div></div>
            <div className="col-6 col-md-3"><div className="stat-card"><div className="stat-value">{summary?.activeServices || 0}</div><div className="stat-label">Servicios en ejecucion</div></div></div>
            <div className="col-6 col-md-3"><div className="stat-card"><div className="stat-value">{summary?.finishedServices || 0}</div><div className="stat-label">Servicios finalizados</div></div></div>
            <div className="col-6 col-md-3"><div className="stat-card"><div className="stat-value">{summary?.profile?.ratingAvg || 0}</div><div className="stat-label">Calificacion promedio</div></div></div>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Mi perfil profesional SST</h2>
            <form className="row g-2" onSubmit={saveProfessionalData}>
              <div className="col-md-6"><input className="form-control" placeholder="Profesion principal" value={professionalProfile.mainProfession} onChange={(e) => setProfessionalProfile((p) => ({ ...p, mainProfession: e.target.value }))} required /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Rol principal" value={professionalProfile.mainRole} onChange={(e) => setProfessionalProfile((p) => ({ ...p, mainRole: e.target.value }))} /></div>
              <div className="col-md-3"><input type="number" min="0" className="form-control" placeholder="Años experiencia" value={professionalProfile.yearsExperience} onChange={(e) => setProfessionalProfile((p) => ({ ...p, yearsExperience: e.target.value }))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Licencia principal" value={professionalProfile.licenseNumber} onChange={(e) => setProfessionalProfile((p) => ({ ...p, licenseNumber: e.target.value }))} /></div>
              <div className="col-md-3"><input type="date" className="form-control" value={professionalProfile.licenseExpiryDate} onChange={(e) => setProfessionalProfile((p) => ({ ...p, licenseExpiryDate: e.target.value }))} /></div>
              <div className="col-md-3"><select className="form-select" value={professionalProfile.availabilityStatus} onChange={(e) => setProfessionalProfile((p) => ({ ...p, availabilityStatus: e.target.value }))}><option value="available">Disponible</option><option value="busy">Ocupado</option><option value="unavailable">No disponible</option></select></div>
              <div className="col-md-4"><input className="form-control" placeholder="Ciudad base" value={professionalProfile.city} onChange={(e) => setProfessionalProfile((p) => ({ ...p, city: e.target.value }))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Departamento" value={professionalProfile.department} onChange={(e) => setProfessionalProfile((p) => ({ ...p, department: e.target.value }))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="URL foto perfil" value={professionalProfile.avatarUrl} onChange={(e) => setProfessionalProfile((p) => ({ ...p, avatarUrl: e.target.value }))} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Especialidades (coma)" value={professionalProfile.specialtiesText} onChange={(e) => setProfessionalProfile((p) => ({ ...p, specialtiesText: e.target.value }))} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Ciudades donde prestas servicio (coma)" value={professionalProfile.serviceMunicipalitiesText} onChange={(e) => setProfessionalProfile((p) => ({ ...p, serviceMunicipalitiesText: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="2" placeholder="Resumen de experiencia" value={professionalProfile.experienceSummary} onChange={(e) => setProfessionalProfile((p) => ({ ...p, experienceSummary: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="3" placeholder="Estudios (linea: titulo|institucion|anio)" value={professionalProfile.studiesText} onChange={(e) => setProfessionalProfile((p) => ({ ...p, studiesText: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="3" placeholder="Licencias (linea: nombre|numero|fecha_yyyy-mm-dd)" value={professionalProfile.licensesText} onChange={(e) => setProfessionalProfile((p) => ({ ...p, licensesText: e.target.value }))} /></div>
              <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="canTravel" type="checkbox" checked={professionalProfile.canTravel} onChange={(e) => setProfessionalProfile((p) => ({ ...p, canTravel: e.target.checked }))} /><label className="form-check-label" htmlFor="canTravel">Disponible para viajar</label></div>
              <div className="col-12"><button type="submit" className="btn btn-bemc btn-sm">Guardar perfil</button></div>
            </form>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Certificaciones</h2>
            <form className="row g-2" onSubmit={addCertification}>
              <div className="col-md-3"><select className="form-select" value={certForm.type} onChange={(e) => setCertForm((p) => ({ ...p, type: e.target.value }))}><option value="licencia_sst">Licencia SST</option><option value="coordinador_alturas">Coordinador alturas</option><option value="curso_50h">Curso 50 horas</option><option value="curso_20h">Curso 20 horas</option><option value="espacios_confinados">Espacios confinados</option><option value="primeros_auxilios">Primeros auxilios</option><option value="otra">Otra</option></select></div>
              <div className="col-md-3"><input className="form-control" placeholder="Titulo" value={certForm.title} onChange={(e) => setCertForm((p) => ({ ...p, title: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="URL archivo" value={certForm.fileUrl} onChange={(e) => setCertForm((p) => ({ ...p, fileUrl: e.target.value }))} required /></div>
              <div className="col-md-1"><input type="date" className="form-control" value={certForm.issuedAt} onChange={(e) => setCertForm((p) => ({ ...p, issuedAt: e.target.value }))} /></div>
              <div className="col-md-1"><input type="date" className="form-control" value={certForm.expiresAt} onChange={(e) => setCertForm((p) => ({ ...p, expiresAt: e.target.value }))} /></div>
              <div className="col-md-1"><button type="submit" className="btn btn-outline-primary w-100 btn-sm">+</button></div>
            </form>
            <div className="table-responsive mt-3"><table className="table table-sm align-middle mb-0"><thead><tr><th>Titulo</th><th>Tipo</th><th>Vence</th><th>Validada</th></tr></thead><tbody>{myCertifications.map((c) => (<tr key={c._id}><td>{c.title}</td><td>{c.type}</td><td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : '—'}</td><td>{c.isVerified ? 'Si' : 'No'}</td></tr>))}</tbody></table></div>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Oportunidades para postular</h2>
            {opportunities.length === 0 ? <p className="text-muted mb-0">No hay oportunidades compatibles por ahora.</p> : (
              <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Empresa</th><th>Tipo requerido</th><th>Ciudad</th><th>Inicio</th><th /></tr></thead><tbody>{opportunities.map((r) => { const alreadyApplied = myApplicationRequestIds.has(r._id); return (<tr key={r._id}><td>{r.company?.legalName || 'Empresa'}</td><td>{r.requiredProfessionalType}</td><td>{r.city}</td><td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td><td><button type="button" className="btn btn-sm btn-bemc" disabled={alreadyApplied} onClick={() => applyToOpportunity(r._id)}>{alreadyApplied ? 'Postulado' : 'Postularme'}</button></td></tr>); })}</tbody></table></div>
            )}
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Mis asignaciones</h2>
            {assignments.length === 0 ? <p className="text-muted mb-0">Aun no tienes asignaciones.</p> : (
              <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Servicio</th><th>Valor</th><th>Estado</th><th>Accion</th><th>Seguimiento</th><th>Cierre</th></tr></thead><tbody>{assignments.map((a) => (<tr key={a._id}><td>{a.request?.requiredProfessionalType || 'Servicio SST'}</td><td>{formatMoney(a.agreedValue)}</td><td><StatusBadge value={a.status} map={assignmentStatuses} /></td><td>{a.status === 'assigned' && a.professionalDecision !== 'accepted' && <div className="d-flex gap-1"><button type="button" className="btn btn-sm btn-outline-success" onClick={() => decideAssignment(a._id, 'accepted')}>Aceptar</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => decideAssignment(a._id, 'rejected')}>Rechazar</button></div>}{a.status === 'assigned' && a.professionalDecision === 'accepted' && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => updateAssignmentStatus(a._id, 'in_execution')}>Iniciar</button>}{a.status === 'in_execution' && <button type="button" className="btn btn-sm btn-success" onClick={() => updateAssignmentStatus(a._id, 'finished')}>Finalizar</button>}{a.status === 'finished' && <span className="small text-success">Finalizado</span>}</td><td className="d-flex gap-1 flex-wrap">{a.status === 'in_execution' && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => createReport(a._id)}>Nuevo reporte</button>}<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => loadReports(a._id)}>Ver reportes</button></td><td className="d-flex gap-1 flex-wrap">{a.status === 'finished' && <><button type="button" className="btn btn-sm btn-outline-success" onClick={() => rateAssignment(a._id)}>Calificar</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => viewFinalArtifact(a._id, 'certificate')}>Certificado</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => viewFinalArtifact(a._id, 'report')}>Informe final</button></>}</td></tr>))}</tbody></table></div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Nueva solicitud marketplace</h2>
            <form className="row g-2" onSubmit={createRequest}>
              <div className="col-md-4"><input className="form-control" placeholder="Nombre de contacto" value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Telefono" value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} required /></div>
              <div className="col-md-4"><input type="email" className="form-control" placeholder="Correo" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Ciudad" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Departamento" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} required /></div>
              <div className="col-md-3"><input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required /></div>
              <div className="col-md-3"><input type="date" className="form-control" value={form.estimatedEndDate} onChange={(e) => setForm((p) => ({ ...p, estimatedEndDate: e.target.value }))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Tipo de profesional requerido" value={form.requiredProfessionalType} onChange={(e) => setForm((p) => ({ ...p, requiredProfessionalType: e.target.value }))} required /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Servicio requerido" value={form.requiredService} onChange={(e) => setForm((p) => ({ ...p, requiredService: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" min="0" placeholder="Exp mín (años)" value={form.minYearsExperience} onChange={(e) => setForm((p) => ({ ...p, minYearsExperience: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" min="1" value={form.workersCount} onChange={(e) => setForm((p) => ({ ...p, workersCount: e.target.value }))} required /></div>
              <div className="col-md-2"><select className="form-select" value={form.riskLevel} onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}><option value="bajo">Riesgo bajo</option><option value="medio">Riesgo medio</option><option value="alto">Riesgo alto</option></select></div>
              <div className="col-md-4"><input className="form-control" placeholder="Especialidades (separadas por coma)" value={form.requiredSpecialtiesText} onChange={(e) => setForm((p) => ({ ...p, requiredSpecialtiesText: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="2" placeholder="Documentos adjuntos (una URL por linea)" value={form.attachmentsText} onChange={(e) => setForm((p) => ({ ...p, attachmentsText: e.target.value }))} /></div>
              <div className="col-12"><textarea className="form-control" rows="3" placeholder="Describe alcance, riesgos y actividades" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required /></div>
              <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="heights" type="checkbox" checked={form.requiresWorkingAtHeights} onChange={(e) => setForm((p) => ({ ...p, requiresWorkingAtHeights: e.target.checked }))} /><label className="form-check-label" htmlFor="heights">Requiere alturas</label></div>
              <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="confined" type="checkbox" checked={form.requiresConfinedSpaces} onChange={(e) => setForm((p) => ({ ...p, requiresConfinedSpaces: e.target.checked }))} /><label className="form-check-label" htmlFor="confined">Requiere espacios confinados</label></div>
              <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="immediate" type="checkbox" checked={form.requiresImmediateAvailability} onChange={(e) => setForm((p) => ({ ...p, requiresImmediateAvailability: e.target.checked }))} /><label className="form-check-label" htmlFor="immediate">Requiere disponibilidad inmediata</label></div>
              <div className="col-md-3 form-check ms-2"><input className="form-check-input" id="publish" type="checkbox" checked={form.publishNow} onChange={(e) => setForm((p) => ({ ...p, publishNow: e.target.checked }))} /><label className="form-check-label" htmlFor="publish">Publicar de inmediato</label></div>
              <div className="col-12"><button type="submit" className="btn btn-bemc btn-sm">Crear solicitud</button></div>
            </form>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Mis solicitudes marketplace</h2>
            {requests.length === 0 ? <p className="text-muted mb-0">No tienes solicitudes creadas.</p> : (
              <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Tipo</th><th>Ciudad</th><th>Estado</th><th>Inicio</th><th>Postulaciones</th></tr></thead><tbody>{requests.map((r) => (<tr key={r._id}><td>{r.requiredProfessionalType}</td><td>{r.city}</td><td><StatusBadge value={r.status} map={requestStatuses} /></td><td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td><td><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => loadApplications(r._id)}>Ver postulaciones</button></td></tr>))}</tbody></table></div>
            )}
          </div>

          {Object.entries(applicationsByRequest).map(([requestId, list]) => (
            <div key={requestId} className="card card-bemc p-3 mb-3">
              <h3 className="h6 mb-3">Postulaciones para solicitud {requestId.slice(-6)}</h3>
              {list.length === 0 ? <p className="text-muted mb-0">No hay postulaciones.</p> : (
                <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Profesional</th><th>Propuesta</th><th>Disponibilidad</th><th>Estado</th><th>Perfil profesional</th><th>Perfil completo</th><th /></tr></thead><tbody>{list.map((a) => (<tr key={a._id}><td>{a.professional?.profile?.firstName || 'Profesional'} {a.professional?.profile?.lastName || ''}</td><td>{formatMoney(a.economicProposal)}</td><td>{a.availabilityNote || '—'}</td><td>{a.status}</td><td className="small"><div>Rating: {a.professionalRatingAvg || 0}</div><div>Servicios: {a.professionalCompletedServices || 0}</div><div>Experiencia: {a.professional?.professionalProfile?.yearsExperience || 0} años</div><div>Estudios: {(a.professional?.professionalProfile?.studies || []).length}</div><div>Licencias: {(a.professional?.professionalProfile?.licenses || []).length}</div><div>Certificaciones: {(a.professionalCertifications || []).length}</div></td><td>{a.professional?._id ? <Link className="btn btn-sm btn-outline-secondary" to={`/profesionales-sst/${a.professional._id}`} target="_blank" rel="noreferrer">Ver perfil completo</Link> : '—'}</td><td><button type="button" className="btn btn-sm btn-bemc" onClick={() => selectProfessional(requestId, a.professional?._id)} disabled={a.status !== 'active'}>Seleccionar</button></td></tr>))}</tbody></table></div>
              )}
            </div>
          ))}

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Asignaciones de mis solicitudes</h2>
            {assignments.length === 0 ? <p className="text-muted mb-0">Aun no hay asignaciones.</p> : (
              <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Profesional</th><th>Servicio</th><th>Valor</th><th>Estado</th><th>Seguimiento</th><th>Cierre</th></tr></thead><tbody>{assignments.map((a) => (<tr key={a._id}><td>{a.professional?.profile?.firstName || 'Profesional'} {a.professional?.profile?.lastName || ''}</td><td>{a.request?.requiredProfessionalType || 'SST'}</td><td>{formatMoney(a.agreedValue)}</td><td><StatusBadge value={a.status} map={assignmentStatuses} /></td><td><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => loadReports(a._id)}>Ver reportes</button></td><td className="d-flex gap-1 flex-wrap">{a.status === 'finished' && <><button type="button" className="btn btn-sm btn-outline-success" onClick={() => rateAssignment(a._id)}>Calificar</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => viewFinalArtifact(a._id, 'certificate')}>Certificado</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => viewFinalArtifact(a._id, 'report')}>Informe final</button></>}</td></tr>))}</tbody></table></div>
            )}
          </div>
        </>
      )}

      {Object.entries(reportsByAssignment).map(([assignmentId, list]) => (
        <div key={assignmentId} className="card card-bemc p-3 mb-3">
          <h3 className="h6 mb-2">Reportes de asignacion {assignmentId.slice(-6)}</h3>
          <ul className="mb-0">
            {list.map((r) => (
              <li key={r._id}>{new Date(r.reportDate).toLocaleDateString('es-CO')} - {r.activities} - {r.workedHours}h</li>
            ))}
          </ul>
        </div>
      ))}

      {Object.entries(ratingsByAssignment).map(([assignmentId, list]) => (
        <div key={assignmentId} className="card card-bemc p-3 mb-3">
          <h3 className="h6 mb-2">Calificaciones de asignacion {assignmentId.slice(-6)}</h3>
          <ul className="mb-0">
            {list.map((r) => (
              <li key={r._id}>{r.type}: {r.score}/5 - {r.comment || 'Sin comentario'}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="card card-bemc p-3 mt-4">
        <h2 className="h5 mb-3">Historial finalizado</h2>
        {history.length === 0 ? <p className="text-muted mb-0">Aun no hay servicios finalizados.</p> : (
          <div className="table-responsive"><table className="table table-sm align-middle mb-0"><thead><tr><th>Servicio</th><th>Ciudad</th><th>Profesional</th><th>Valor</th><th>Fecha fin</th></tr></thead><tbody>{history.map((h) => (<tr key={h._id}><td>{h.request?.requiredProfessionalType || 'SST'}</td><td>{h.request?.city || '—'}</td><td>{h.professional?.profile?.firstName || 'Profesional'} {h.professional?.profile?.lastName || ''}</td><td>{formatMoney(h.agreedValue)}</td><td>{h.finishedAt ? new Date(h.finishedAt).toLocaleDateString('es-CO') : '—'}</td></tr>))}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
