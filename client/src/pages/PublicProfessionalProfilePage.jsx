import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const textFixes = {
  'Construcci�n': 'Construcción',
  'Miner�a': 'Minería',
  'Petr�leo': 'Petróleo',
  'Educaci�n': 'Educación',
  'SISO por d�as': 'SISO por días',
  'Consultor�a': 'Consultoría',
  'Investigaci�n de accidentes': 'Investigación de accidentes',
  'Especializaci�n': 'Especialización',
};

function normalizeCorruptedText(value) {
  if (!value) return '';
  const text = String(value).trim();
  return textFixes[text] || text;
}

function normalizeArray(values) {
  return (values || []).map((v) => normalizeCorruptedText(v)).filter(Boolean);
}

export default function PublicProfessionalProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
    api.get(`/public/professionals/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div className="container py-5"><div className="spinner-border text-primary" /></div>;

  const p = data.professionalProfile || {};
  const profile = data.profile || {};

  return (
    <section className="container py-5">
      <div className="card card-bemc p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          {profile.avatarUrl && !avatarError ? (
            <img
              src={profile.avatarUrl}
              alt="perfil"
              width="90"
              height="90"
              style={{ objectFit: 'cover', borderRadius: 12 }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="bg-light border rounded d-flex align-items-center justify-content-center" style={{ width: 90, height: 90 }}>
              <strong className="text-muted">{(profile.firstName || 'P').charAt(0).toUpperCase()}</strong>
            </div>
          )}
          <div>
            <h1 className="h3 mb-1">{profile.firstName || ''} {profile.lastName || ''}</h1>
            <div className="text-muted">{p.mainProfession || 'Profesional SST'} · {p.specialty || 'Especialidad no definida'}</div>
            <div className="small text-muted">{profile.city || p.city || 'Ciudad no definida'} · Calificación {p.ratingAvg || 0} · Servicios {p.completedServicesCount || 0}</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6"><h2 className="h6">Presentación</h2><p className="small text-muted mb-0">{profile.bio || p.experienceSummary || 'Sin presentación registrada.'}</p></div>
          <div className="col-md-6"><h2 className="h6">Licencia SST</h2><div className="small">Número: {p.licenseNumber || '—'}</div><div className="small">Estado: {p.licenseStatus || '—'}</div><div className="small">Vence: {p.licenseExpiryDate ? new Date(p.licenseExpiryDate).toLocaleDateString('es-CO') : '—'}</div></div>
          <div className="col-md-6"><h2 className="h6">Áreas de experiencia</h2><p className="small mb-0">{normalizeArray(p.areasExperience).join(', ') || 'No registradas'}</p></div>
          <div className="col-md-6"><h2 className="h6">Servicios ofrecidos</h2><p className="small mb-0">{normalizeArray(p.servicesOffered).join(', ') || 'No registrados'}</p></div>
          <div className="col-md-6"><h2 className="h6">Cobertura</h2><p className="small mb-0">Municipios: {(p.serviceMunicipalities || []).join(', ') || '—'}</p><p className="small mb-0">Departamentos: {(p.serviceDepartments || []).join(', ') || '—'}</p><p className="small mb-0">Viaja: {p.canTravel ? 'Sí' : 'No'} · Inmediata: {p.immediateAvailability ? 'Sí' : 'No'}</p></div>
          <div className="col-md-6"><h2 className="h6">Experiencia y estudios</h2><p className="small mb-0">Experiencias: {(p.workExperiences || []).length}</p><p className="small mb-0">Formación: {(p.educationItems || []).length}</p><p className="small mb-0">Certificaciones: {(data.certifications || []).length}</p></div>
        </div>

        <hr />
        <h2 className="h6">Experiencia laboral</h2>
        <ul className="small">{(p.workExperiences || []).map((w, idx) => <li key={`w-${idx}`}>{w.company} - {w.role} ({w.city || '—'})</li>)}</ul>

        <h2 className="h6">Formación académica</h2>
        <ul className="small">{(p.educationItems || []).map((ed, idx) => <li key={`e-${idx}`}>{normalizeCorruptedText(ed.level)}: {ed.title} - {ed.institution}</li>)}</ul>

        <h2 className="h6">Certificaciones</h2>
        <ul className="small">{(data.certifications || []).map((c) => <li key={c._id}>{c.title} ({c.type})</li>)}</ul>

        <h2 className="h6">Comentarios de empresas</h2>
        {(data.companyComments || []).length === 0 ? <p className="small text-muted">Aún no hay comentarios.</p> : <ul className="small">{data.companyComments.map((c, idx) => <li key={`c-${idx}`}>{c.score}/5 - {c.comment || 'Sin comentario'} ({c.companyName || 'Empresa'})</li>)}</ul>}
      </div>
    </section>
  );
}
