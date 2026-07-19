import { useEffect, useState } from 'react';
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
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead><tr><th>Foto</th><th>Nombre</th><th>Profesion</th><th>Experiencia</th><th>Licencia SST</th><th>Certificaciones</th><th>Estudios</th><th>Calificacion</th><th>Servicios</th><th>Valor</th><th>Disponibilidad</th><th /></tr></thead>
              <tbody>
                {(appsByReq[r._id] || []).map((a) => (
                  <tr key={a._id}>
                    <td>{a.professional?.profile?.avatarUrl ? <img src={a.professional.profile.avatarUrl} alt="foto" width="40" height="40" style={{ objectFit: 'cover', borderRadius: 8 }} /> : '—'}</td>
                    <td>{a.professional?.profile?.firstName || ''} {a.professional?.profile?.lastName || ''}</td>
                    <td>{a.professional?.professionalProfile?.mainProfession || 'Profesional SST'}</td>
                    <td>{a.professional?.professionalProfile?.yearsExperience || 0} años</td>
                    <td>{a.professional?.professionalProfile?.licenseNumber || '—'}</td>
                    <td>{(a.professionalCertifications || []).length}</td>
                    <td>{(a.professional?.professionalProfile?.studies || []).length}</td>
                    <td>{a.professionalRatingAvg || 0}</td>
                    <td>{a.professionalCompletedServices || 0}</td>
                    <td>{formatMoney(a.economicProposal)}</td>
                    <td>{a.availabilityNote || '—'}</td>
                    <td><button className="btn btn-sm btn-bemc" disabled={a.status !== 'active'} onClick={() => selectPro(r._id, a.professional?._id)}>Seleccionar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
