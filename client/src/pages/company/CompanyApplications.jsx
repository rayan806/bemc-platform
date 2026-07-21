import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';

function formatMoney(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
}

export default function CompanyApplications() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [appsByReq, setAppsByReq] = useState({});
  const [matchesByReq, setMatchesByReq] = useState({});

  const highlightedRequestId = searchParams.get('requestId') || '';
  const highlightedProfessionalId = searchParams.get('professionalId') || '';

  useEffect(() => {
    api.get('/marketplace/requests').then((r) => setRequests((r.data || []).filter((x) => ['published', 'in_postulation', 'professional_selected'].includes(x.status))));
  }, []);

  useEffect(() => {
    if (!highlightedRequestId) return;
    if (!requests.some((row) => row._id === highlightedRequestId)) return;
    loadCandidates(highlightedRequestId);
  }, [highlightedRequestId, requests]);

  const loadApps = async (requestId) => {
    const { data } = await api.get(`/marketplace/requests/${requestId}/applications`);
    setAppsByReq((p) => ({ ...p, [requestId]: data || [] }));
  };

  const loadMatches = async (requestId) => {
    const { data } = await api.get(`/marketplace/requests/${requestId}/matches`);
    setMatchesByReq((p) => ({ ...p, [requestId]: data || [] }));
  };

  const loadCandidates = async (requestId) => {
    await Promise.all([loadApps(requestId), loadMatches(requestId)]);
  };

  const selectPro = async (requestId, professionalId) => {
    const agreedValue = window.prompt('Valor acordado en COP');
    if (!agreedValue) return;
    await api.post(`/marketplace/requests/${requestId}/select`, { professionalId, agreedValue: Number(agreedValue) });
    loadApps(requestId);
  };

  return (
    <div>
      <h2 className="h4 mb-3">Postulaciones</h2>
      {requests.map((r) => (
        <div key={r._id} className="card card-bemc p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="h6 mb-0">{r.requiredProfessionalType} - {r.city}</h3>
            <button className="btn btn-sm btn-outline-primary" onClick={() => loadCandidates(r._id)}>Cargar candidatos</button>
          </div>
          {(appsByReq[r._id] || []).length === 0 ? (
            <div>
              <p className="small text-muted mb-2">Aun no hay postulaciones para esta solicitud.</p>
              {(matchesByReq[r._id] || []).length > 0 && (
                <div>
                  <div className="small fw-semibold mb-2">Profesionales sugeridos ({(matchesByReq[r._id] || []).length})</div>
                  <div className="row g-2">
                    {(matchesByReq[r._id] || []).slice(0, 6).map((m) => (
                      <div className="col-xl-6" key={m._id}>
                        <div
                          className="border rounded p-2 bg-white h-100"
                          style={
                            highlightedRequestId === r._id && highlightedProfessionalId === m._id
                              ? { borderColor: 'var(--bs-warning)', boxShadow: '0 0 0 2px rgba(255, 193, 7, 0.25)' }
                              : undefined
                          }
                        >
                          <div className="fw-semibold">{m.profile?.firstName || ''} {m.profile?.lastName || ''}</div>
                          <div className="small text-muted mb-1">{m.professionalProfile?.mainProfession || 'Profesional SST'}</div>
                          <div className="small text-muted">Ciudad: {m.profile?.city || m.professionalProfile?.city || 'No definida'}</div>
                          <div className="small text-muted">Score de match: {Number(m.score || 0).toFixed(1)}</div>
                          <div className="small text-muted mb-2">Esperando su postulación para poder seleccionarlo.</div>
                          <Link className="btn btn-sm btn-outline-secondary" to={`/profesionales-sst/${m._id}`} target="_blank" rel="noreferrer">
                            Ver perfil completo
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {(appsByReq[r._id] || []).map((a) => (
                <div className="col-xl-6" key={a._id}>
                  <div
                    className="border rounded p-3 h-100 bg-white"
                    style={
                      highlightedRequestId === r._id && highlightedProfessionalId === a.professional?._id
                        ? { borderColor: 'var(--bs-warning)', boxShadow: '0 0 0 2px rgba(255, 193, 7, 0.25)' }
                        : undefined
                    }
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      {a.professional?.profile?.avatarUrl ? (
                        <img src={a.professional.profile.avatarUrl} alt="foto" width="56" height="56" style={{ objectFit: 'cover', borderRadius: 10 }} />
                      ) : (
                        <div className="bg-light border rounded d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                          <span className="text-muted">SST</span>
                        </div>
                      )}
                      <div>
                        <div className="fw-semibold">{a.professional?.profile?.firstName || ''} {a.professional?.profile?.lastName || ''}</div>
                        <div className="small text-muted">{a.professional?.professionalProfile?.mainProfession || 'Profesional SST'}</div>
                      </div>
                    </div>

                    <div className="row g-2 small mb-3">
                      <div className="col-6"><span className="text-muted">Ciudad:</span> {a.professional?.profile?.city || a.professional?.professionalProfile?.city || 'No definida'}</div>
                      <div className="col-6"><span className="text-muted">Experiencia:</span> {a.professional?.professionalProfile?.yearsExperience || 0} anos</div>
                      <div className="col-6"><span className="text-muted">Calificacion:</span> {a.professionalRatingAvg || 0}</div>
                      <div className="col-6"><span className="text-muted">Valor ofertado:</span> {formatMoney(a.economicProposal)}</div>
                      <div className="col-6"><span className="text-muted">Licencia SST:</span> {a.professional?.professionalProfile?.licenseNumber ? 'Vigente/registrada' : 'Sin registro'}</div>
                      <div className="col-6"><span className="text-muted">Certificaciones:</span> {(a.professionalCertifications || []).length}</div>
                    </div>

                    {a.availabilityNote && <p className="small text-muted mb-3">Disponibilidad: {a.availabilityNote}</p>}

                    <div className="d-flex flex-wrap gap-2">
                      {a.professional?._id ? (
                        <Link className="btn btn-sm btn-outline-secondary" to={`/profesionales-sst/${a.professional._id}`} target="_blank" rel="noreferrer">Ver perfil completo</Link>
                      ) : null}
                      <button className="btn btn-sm btn-bemc" disabled={a.status !== 'active'} onClick={() => selectPro(r._id, a.professional?._id)}>Seleccionar profesional</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
