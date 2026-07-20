import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-CO');
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function expiryBadge(expiresAt) {
  if (!expiresAt) return { tone: 'secondary', label: 'Sin vencimiento' };
  const now = Date.now();
  const ts = new Date(expiresAt).getTime();
  const days = Math.ceil((ts - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { tone: 'danger', label: 'Vencida' };
  if (days <= 45) return { tone: 'warning', label: `Vence en ${days} dias` };
  return { tone: 'success', label: 'Vigente' };
}

export default function PublicProfessionalProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    api.get(`/public/professionals/${id}`)
      .then((res) => {
        if (mounted) setData(res.data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'No fue posible cargar el perfil.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const profile = data?.profile || {};
  const professional = data?.professionalProfile || {};
  const certifications = data?.certifications || [];
  const documents = data?.documents || [];
  const comments = data?.companyComments || [];

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Profesional SST';

  const avgScore = useMemo(() => {
    if (!comments.length) return Number(professional.ratingAvg || 0);
    const total = comments.reduce((acc, item) => acc + Number(item.score || 0), 0);
    return Number((total / comments.length).toFixed(1));
  }, [comments, professional.ratingAvg]);

  if (loading) {
    return (
      <section className="container py-5">
        <div className="card card-bemc p-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-5">
        <div className="alert alert-warning">{error}</div>
        <Link className="btn btn-outline-primary" to="/profesionales-sst">Volver al listado</Link>
      </section>
    );
  }

  return (
    <section className="container py-5">
      <div className="card card-bemc p-3 p-lg-4 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div className="d-flex align-items-center gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="foto profesional"
                width="96"
                height="96"
                className="rounded-3 border"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="rounded-3 border bg-light d-flex align-items-center justify-content-center" style={{ width: 96, height: 96 }}>
                <strong className="text-muted">{getInitials(fullName) || 'PS'}</strong>
              </div>
            )}
            <div>
              <h1 className="h3 mb-1">{fullName}</h1>
              <div className="text-muted">{professional.mainProfession || 'Profesional SST'} · {professional.specialty || 'Especialidad no definida'}</div>
              <div className="small text-muted">{professional.city || 'Ciudad'} · {professional.department || 'Departamento'}</div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <span className={`badge text-bg-${professional.availabilityStatus === 'available' ? 'success' : professional.availabilityStatus === 'busy' ? 'warning' : 'secondary'}`}>
              {professional.availabilityStatus === 'available' ? 'Disponible' : professional.availabilityStatus === 'busy' ? 'Ocupado' : 'No disponible'}
            </span>
            <span className="badge text-bg-light border">Licencia: {professional.licenseNumber || 'No registrada'}</span>
          </div>
        </div>

        <div className="row g-2 mt-3">
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{professional.yearsExperience || 0}</strong><span>Anios exp.</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{Number(professional.completedServicesCount || 0)}</strong><span>Servicios</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{avgScore}</strong><span>Rating</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{certifications.length}</strong><span>Certificaciones</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{documents.length}</strong><span>Documentos</span></div></div>
          <div className="col-6 col-lg-2"><div className="profile-metric"><strong>{professional.immediateAvailability ? 'Si' : 'No'}</strong><span>Inmediato</span></div></div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card card-bemc p-3 mb-3">
            <h2 className="h6 mb-2">Perfil profesional</h2>
            <p className="mb-0 text-muted">{profile.bio || professional.experienceSummary || 'Sin resumen profesional.'}</p>
          </div>

          <div className="card card-bemc p-3 mb-3">
            <h2 className="h6 mb-3">Experiencia laboral</h2>
            {!professional.workExperiences?.length ? (
              <p className="text-muted small mb-0">No hay experiencia publicada.</p>
            ) : (
              <div className="timeline-list">
                {professional.workExperiences.map((work, idx) => (
                  <div key={`wk-${idx}`} className="timeline-item">
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

          <div className="card card-bemc p-3">
            <h2 className="h6 mb-3">Formacion academica</h2>
            {!professional.educationItems?.length ? (
              <p className="text-muted small mb-0">No hay formacion publicada.</p>
            ) : (
              <div className="row g-2">
                {professional.educationItems.map((ed, idx) => (
                  <div className="col-md-6" key={`ed-${idx}`}>
                    <div className="border rounded p-2 h-100 bg-white">
                      <div className="fw-semibold">{ed.level || 'Nivel no definido'}</div>
                      <div className="small">{ed.title || 'Titulo no definido'}</div>
                      <div className="small text-muted">{ed.institution || 'Institucion no definida'}</div>
                      <div className="small text-muted">{formatDate(ed.startDate)} - {ed.endDate ? formatDate(ed.endDate) : 'Actual'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-bemc p-3 mb-3">
            <h2 className="h6 mb-2">Servicios y areas</h2>
            <div className="mb-2">
              <div className="small fw-semibold mb-1">Servicios</div>
              <div className="d-flex flex-wrap gap-2">
                {(professional.servicesOffered || []).length ? (professional.servicesOffered || []).map((s) => <span key={s} className="profile-chip">{s}</span>) : <span className="text-muted small">Sin servicios publicados</span>}
              </div>
            </div>
            <div>
              <div className="small fw-semibold mb-1">Areas de experiencia</div>
              <div className="d-flex flex-wrap gap-2">
                {(professional.areasExperience || []).length ? (professional.areasExperience || []).map((a) => <span key={a} className="profile-chip profile-chip-soft">{a}</span>) : <span className="text-muted small">Sin areas publicadas</span>}
              </div>
            </div>
          </div>

          <div className="card card-bemc p-3 mb-3">
            <h2 className="h6 mb-2">Licencia y certificaciones</h2>
            <div className="small mb-1"><strong>Licencia SST:</strong> {professional.licenseNumber || 'No registrada'}</div>
            <div className="small mb-2"><strong>Vence:</strong> {formatDate(professional.licenseExpiryDate)}</div>
            <div className="mb-2"><span className={`badge text-bg-${expiryBadge(professional.licenseExpiryDate).tone}`}>{expiryBadge(professional.licenseExpiryDate).label}</span></div>
            <hr />
            {!certifications.length ? (
              <p className="text-muted small mb-0">Sin certificaciones publicadas.</p>
            ) : (
              <div className="d-grid gap-2">
                {certifications.slice(0, 6).map((cert) => (
                  <div key={cert._id} className="border rounded p-2 bg-white">
                    <div className="fw-semibold small">{cert.title}</div>
                    <div className="small text-muted">{cert.type}</div>
                    <div className="small">Expedida: {formatDate(cert.issuedAt)}</div>
                    <div className="small">Vence: {formatDate(cert.expiresAt)}</div>
                    <div className="mt-1 d-flex gap-2">
                      <span className={`badge text-bg-${cert.isVerified ? 'success' : 'secondary'}`}>{cert.isVerified ? 'Verificada' : 'Pendiente'}</span>
                      <span className={`badge text-bg-${expiryBadge(cert.expiresAt).tone}`}>{expiryBadge(cert.expiresAt).label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-bemc p-3">
            <h2 className="h6 mb-2">Comentarios de empresas</h2>
            {!comments.length ? (
              <p className="text-muted small mb-0">Todavia no hay comentarios publicados.</p>
            ) : (
              <div className="d-grid gap-2">
                {comments.slice(0, 5).map((comment, idx) => (
                  <div key={`cm-${idx}`} className="border rounded p-2 bg-white">
                    <div className="small fw-semibold">{comment.companyName || 'Empresa'}</div>
                    <div className="small text-muted">{formatDate(comment.createdAt)} · {comment.score}/5</div>
                    <p className="small mb-0 mt-1">{comment.comment || 'Sin comentario'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4 gap-2 flex-wrap">
        <Link to="/profesionales-sst" className="btn btn-outline-primary">Volver a profesionales</Link>
        <Link to="/cotizacion-empresas" className="btn btn-bemc">Solicitar este perfil</Link>
      </div>
    </section>
  );
}
