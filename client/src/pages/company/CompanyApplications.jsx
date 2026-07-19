import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

function formatMoney(v) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0));
}

export default function CompanyApplications() {
  const [requests, setRequests] = useState([]);
  const [appsByReq, setAppsByReq] = useState({});

  useEffect(() => {
    api.get('/marketplace/requests').then((r) => setRequests((r.data || []).filter((x) => ['published', 'in_postulation', 'professional_selected'].includes(x.status))));
  }, []);

  const loadApps = async (requestId) => {
    const { data } = await api.get(`/marketplace/requests/${requestId}/applications`);
    setAppsByReq((p) => ({ ...p, [requestId]: data || [] }));
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
            <button className="btn btn-sm btn-outline-primary" onClick={() => loadApps(r._id)}>Cargar candidatos</button>
          </div>
          {(appsByReq[r._id] || []).length === 0 ? (
            <p className="small text-muted mb-0">Aun no hay postulaciones para esta solicitud.</p>
          ) : (
            <div className="row g-3">
              {(appsByReq[r._id] || []).map((a) => (
                <div className="col-xl-6" key={a._id}>
                  <div className="border rounded p-3 h-100 bg-white">
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
