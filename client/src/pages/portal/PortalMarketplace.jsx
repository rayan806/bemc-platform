/**
 * Archivo: client/src/pages/portal/PortalMarketplace.jsx
 * Proposito: Modulo Marketplace SST para empresas y profesionales.
 */

import { useEffect, useMemo, useState } from 'react';
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

  const [applicationsByRequest, setApplicationsByRequest] = useState({});

  const [form, setForm] = useState({
    contactName: user?.profile?.firstName || '',
    contactPhone: user?.profile?.phone || '',
    contactEmail: user?.email || '',
    city: '',
    department: '',
    startDate: '',
    estimatedEndDate: '',
    requiredProfessionalType: '',
    workersCount: 1,
    riskLevel: 'medio',
    description: '',
    requiresWorkingAtHeights: false,
    requiresConfinedSpaces: false,
    requiredSpecialtiesText: '',
    publishNow: true,
  });

  const isProfessional = user?.role === 'professional_sst';
  const isCompanyClient = user?.role === 'client' && user?.accountType === 'company';

  const canUseMarketplace = isProfessional || isCompanyClient || user?.role === 'admin';

  const refresh = async () => {
    setError('');
    try {
      if (isProfessional) {
        const [summaryRes, opportunitiesRes, applicationsRes, assignmentsRes] = await Promise.all([
          api.get('/marketplace/summary'),
          api.get('/marketplace/opportunities'),
          api.get('/marketplace/applications/mine'),
          api.get('/marketplace/assignments'),
        ]);
        setSummary(summaryRes.data);
        setOpportunities(opportunitiesRes.data || []);
        setMyApplications(applicationsRes.data || []);
        setAssignments(assignmentsRes.data || []);
      } else {
        const [requestsRes, assignmentsRes] = await Promise.all([
          api.get('/marketplace/requests'),
          api.get('/marketplace/assignments'),
        ]);
        setRequests(requestsRes.data || []);
        setAssignments(assignmentsRes.data || []);
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
        requiredSpecialties: form.requiredSpecialtiesText
          .split(',')
          .map((s) => s.trim())
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
        workersCount: 1,
        riskLevel: 'medio',
        description: '',
        requiresWorkingAtHeights: false,
        requiresConfinedSpaces: false,
        requiredSpecialtiesText: '',
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

    try {
      await api.post(`/marketplace/requests/${requestId}/applications`, {
        economicProposal: Number(economicProposal),
      });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo postular');
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

  if (loading) {
    return <div className="spinner-border text-primary" />;
  }

  if (!canUseMarketplace) {
    return (
      <div className="card card-bemc p-4">
        <h1 className="h4">Marketplace SST</h1>
        <p className="text-muted mb-0">
          Esta seccion esta disponible para empresas y profesionales SST.
        </p>
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
            <div className="col-6 col-md-3">
              <div className="stat-card">
                <div className="stat-value">{summary?.activeApplications || 0}</div>
                <div className="stat-label">Postulaciones activas</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card">
                <div className="stat-value">{summary?.activeServices || 0}</div>
                <div className="stat-label">Servicios en ejecucion</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card">
                <div className="stat-value">{summary?.finishedServices || 0}</div>
                <div className="stat-label">Servicios finalizados</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="stat-card">
                <div className="stat-value">{summary?.ratingAvg || 0}</div>
                <div className="stat-label">Calificacion promedio</div>
              </div>
            </div>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Oportunidades para postular</h2>
            {opportunities.length === 0 ? (
              <p className="text-muted mb-0">No hay oportunidades compatibles por ahora.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Tipo requerido</th>
                      <th>Ciudad</th>
                      <th>Inicio</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((r) => {
                      const alreadyApplied = myApplicationRequestIds.has(r._id);
                      return (
                        <tr key={r._id}>
                          <td>{r.company?.legalName || 'Empresa'}</td>
                          <td>{r.requiredProfessionalType}</td>
                          <td>{r.city}</td>
                          <td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-bemc"
                              disabled={alreadyApplied}
                              onClick={() => applyToOpportunity(r._id)}
                            >
                              {alreadyApplied ? 'Postulado' : 'Postularme'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Mis asignaciones</h2>
            {assignments.length === 0 ? (
              <p className="text-muted mb-0">Aun no tienes asignaciones.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Valor</th>
                      <th>Estado</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a._id}>
                        <td>{a.request?.requiredProfessionalType || 'Servicio SST'}</td>
                        <td>{formatMoney(a.agreedValue)}</td>
                        <td>
                          <StatusBadge value={a.status} map={assignmentStatuses} />
                        </td>
                        <td>
                          {a.status === 'assigned' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => updateAssignmentStatus(a._id, 'in_execution')}
                            >
                              Iniciar
                            </button>
                          )}
                          {a.status === 'in_execution' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => updateAssignmentStatus(a._id, 'finished')}
                            >
                              Finalizar
                            </button>
                          )}
                          {a.status === 'finished' && (
                            <span className="small text-success">Finalizado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Nueva solicitud marketplace</h2>
            <form className="row g-2" onSubmit={createRequest}>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Nombre de contacto"
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Telefono"
                  value={form.contactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Correo"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Ciudad"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Departamento"
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={form.estimatedEndDate}
                  onChange={(e) => setForm((p) => ({ ...p, estimatedEndDate: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Tipo de profesional requerido"
                  value={form.requiredProfessionalType}
                  onChange={(e) => setForm((p) => ({ ...p, requiredProfessionalType: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={form.workersCount}
                  onChange={(e) => setForm((p) => ({ ...p, workersCount: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={form.riskLevel}
                  onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}
                >
                  <option value="bajo">Riesgo bajo</option>
                  <option value="medio">Riesgo medio</option>
                  <option value="alto">Riesgo alto</option>
                </select>
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Especialidades (separadas por coma)"
                  value={form.requiredSpecialtiesText}
                  onChange={(e) => setForm((p) => ({ ...p, requiredSpecialtiesText: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe alcance, riesgos y actividades"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4 form-check ms-2">
                <input
                  className="form-check-input"
                  id="heights"
                  type="checkbox"
                  checked={form.requiresWorkingAtHeights}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, requiresWorkingAtHeights: e.target.checked }))
                  }
                />
                <label className="form-check-label" htmlFor="heights">
                  Requiere alturas
                </label>
              </div>
              <div className="col-md-4 form-check ms-2">
                <input
                  className="form-check-input"
                  id="confined"
                  type="checkbox"
                  checked={form.requiresConfinedSpaces}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, requiresConfinedSpaces: e.target.checked }))
                  }
                />
                <label className="form-check-label" htmlFor="confined">
                  Requiere espacios confinados
                </label>
              </div>
              <div className="col-md-3 form-check ms-2">
                <input
                  className="form-check-input"
                  id="publish"
                  type="checkbox"
                  checked={form.publishNow}
                  onChange={(e) => setForm((p) => ({ ...p, publishNow: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="publish">
                  Publicar de inmediato
                </label>
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-bemc btn-sm">
                  Crear solicitud
                </button>
              </div>
            </form>
          </div>

          <div className="card card-bemc p-3 mb-4">
            <h2 className="h5 mb-3">Mis solicitudes marketplace</h2>
            {requests.length === 0 ? (
              <p className="text-muted mb-0">No tienes solicitudes creadas.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Ciudad</th>
                      <th>Estado</th>
                      <th>Inicio</th>
                      <th>Postulaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id}>
                        <td>{r.requiredProfessionalType}</td>
                        <td>{r.city}</td>
                        <td>
                          <StatusBadge value={r.status} map={requestStatuses} />
                        </td>
                        <td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => loadApplications(r._id)}
                          >
                            Ver postulaciones
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {Object.entries(applicationsByRequest).map(([requestId, list]) => (
            <div key={requestId} className="card card-bemc p-3 mb-3">
              <h3 className="h6 mb-3">Postulaciones para solicitud {requestId.slice(-6)}</h3>
              {list.length === 0 ? (
                <p className="text-muted mb-0">No hay postulaciones.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Profesional</th>
                        <th>Propuesta</th>
                        <th>Estado</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((a) => (
                        <tr key={a._id}>
                          <td>
                            {a.professional?.profile?.firstName || 'Profesional'}{' '}
                            {a.professional?.profile?.lastName || ''}
                          </td>
                          <td>{formatMoney(a.economicProposal)}</td>
                          <td>{a.status}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-bemc"
                              onClick={() => selectProfessional(requestId, a.professional?._id)}
                              disabled={a.status !== 'active'}
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          <div className="card card-bemc p-3">
            <h2 className="h5 mb-3">Asignaciones de mis solicitudes</h2>
            {assignments.length === 0 ? (
              <p className="text-muted mb-0">Aun no hay asignaciones.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Profesional</th>
                      <th>Servicio</th>
                      <th>Valor</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a._id}>
                        <td>
                          {a.professional?.profile?.firstName || 'Profesional'}{' '}
                          {a.professional?.profile?.lastName || ''}
                        </td>
                        <td>{a.request?.requiredProfessionalType || 'SST'}</td>
                        <td>{formatMoney(a.agreedValue)}</td>
                        <td>
                          <StatusBadge value={a.status} map={assignmentStatuses} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
