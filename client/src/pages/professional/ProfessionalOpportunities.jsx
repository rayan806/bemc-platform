import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return 'A convenir';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v));
}

export default function ProfessionalOpportunities() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [forms, setForms] = useState({});
  const [busyId, setBusyId] = useState('');

  const highlightedRequestId = searchParams.get('requestId') || '';

  const load = () => api.get('/marketplace/opportunities').then((r) => setRows(r.data || []));

  const orderedRows = useMemo(() => {
    if (!highlightedRequestId) return rows;
    return [...rows].sort((a, b) => {
      if (a._id === highlightedRequestId) return -1;
      if (b._id === highlightedRequestId) return 1;
      return 0;
    });
  }, [rows, highlightedRequestId]);

  useEffect(() => {
    load();
  }, []);

  const setField = (requestId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [requestId]: {
        economicProposal: prev[requestId]?.economicProposal || '',
        availabilityNote: prev[requestId]?.availabilityNote || '',
        observations: prev[requestId]?.observations || '',
        [field]: value,
      },
    }));
  };

  const apply = async (request) => {
    const form = forms[request._id] || {};
    const fallbackProposal = Number(request.budgetReference || 0);
    const economicProposal = Number(form.economicProposal || fallbackProposal);

    setBusyId(request._id);
    try {
      await api.post(`/marketplace/requests/${request._id}/applications`, {
        economicProposal,
        availabilityNote: form.availabilityNote || 'Disponible para iniciar según solicitud.',
        observations: form.observations || 'Postulación enviada desde notificación.',
      });
      setForms((prev) => ({
        ...prev,
        [request._id]: { economicProposal: '', availabilityNote: '', observations: '' },
      }));
      load();
    } finally {
      setBusyId('');
    }
  };

  const rejectOpportunity = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/marketplace/requests/${id}/reject`);
      setRows((prev) => prev.filter((row) => row._id !== id));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <h2 className="h4 mb-3">Solicitudes disponibles</h2>
      {highlightedRequestId && (
        <div className="alert alert-info py-2">
          Estás viendo una solicitud abierta desde tu notificación. Puedes decidir ahora mismo:
          <strong> Aceptar</strong> o <strong>Rechazar</strong>.
        </div>
      )}
      <div className="d-grid gap-3">
        {orderedRows.map((r) => {
          const form = forms[r._id] || {};
          const highlighted = highlightedRequestId === r._id;

          return (
            <div
              key={r._id}
              className="card card-bemc p-3"
              style={highlighted ? { borderColor: 'var(--bs-warning)', boxShadow: '0 0 0 2px rgba(255, 193, 7, 0.25)' } : undefined}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <h3 className="h6 mb-1">{r.requiredProfessionalType}</h3>
                  <div className="text-muted small">{r.company?.legalName || 'Empresa'} · {r.city}</div>
                </div>
                <div className="text-muted small text-end">
                  <div>Inicio: {new Date(r.startDate).toLocaleDateString('es-CO')}</div>
                  <div>Duracion: {r.schedule || 'Segun alcance'}</div>
                </div>
              </div>

              <div className="row g-2 small mb-3">
                <div className="col-md-3"><span className="text-muted">Disponibilidad:</span> {r.requiredAvailability || (r.requiresImmediateAvailability ? 'immediate' : 'this_week')}</div>
                <div className="col-md-3"><span className="text-muted">Presupuesto:</span> {formatMoney(r.budgetReference)}</div>
                <div className="col-md-3"><span className="text-muted">Riesgo:</span> {r.riskLevel || 'No definido'}</div>
                <div className="col-md-3"><span className="text-muted">Trabajadores:</span> {r.workersCount || 0}</div>
              </div>

              <p className="small mb-3">{r.description}</p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button className="btn btn-sm btn-bemc" disabled={busyId === r._id} onClick={() => apply(r)}>
                  Aceptar
                </button>
                <button className="btn btn-sm btn-outline-secondary" disabled={busyId === r._id} onClick={() => rejectOpportunity(r._id)}>
                  Rechazar
                </button>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-4">
                  <label className="form-label small">Valor de tu propuesta (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.economicProposal || ''}
                    onChange={(e) => setField(r._id, 'economicProposal', e.target.value)}
                    placeholder="Ej. 2500000"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Disponibilidad</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.availabilityNote || ''}
                    onChange={(e) => setField(r._id, 'availabilityNote', e.target.value)}
                    placeholder="Ej. Disponible desde el lunes"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Comentarios</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.observations || ''}
                    onChange={(e) => setField(r._id, 'observations', e.target.value)}
                    placeholder="Comentarios adicionales"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
