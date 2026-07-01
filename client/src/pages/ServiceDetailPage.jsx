import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { categoryLabels, getServicePresentation } from '../utils/servicePresentation';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/services/${slug}`)
      .then((res) => setService(res.data))
      .catch(() => setError('Servicio no encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRequest = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/servicios/${slug}` } });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/requests', {
        serviceId: service._id,
        clientNotes: notes,
      });
      navigate('/portal/solicitudes');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-5">
        <p className="text-danger">{error}</p>
        <Link to="/servicios">Volver al catálogo</Link>
      </div>
    );
  }

  const visual = getServicePresentation(service);

  return (
    <div className="container py-5">
      <Link to="/servicios" className="text-muted small">
        ← Volver a servicios
      </Link>
      <div className="row g-4 mt-3">
        <div className="col-lg-8">
          <div className={`service-image service-image--detail service-image--${visual.tone}`}>
            <i className={`bi ${visual.icon}`} />
            <span>{categoryLabels[service.category] || service.category}</span>
          </div>
          <h1 className="mb-3 mt-4">{service.name}</h1>
          <p className="lead text-muted">{service.shortDescription}</p>
          <div className="service-detail-copy">
            <p>{service.description}</p>
          </div>
          {service.duration && (
            <p>
              <strong>Duración estimada:</strong> {service.duration}
            </p>
          )}
          {service.requiredDocuments?.length > 0 && (
            <div className="mt-4">
              <h2 className="h6">Documentos que podrías necesitar</h2>
              <ul>
                {service.requiredDocuments.map((document) => (
                  <li key={document}>{document}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="col-lg-4">
          <div className="card card-bemc p-4 sticky-top" style={{ top: '1rem' }}>
            <h2 className="h5 mb-2">Solicitar cotización</h2>
            <p className="small text-muted">
              Cuéntanos qué necesitas y el administrador revisará tu caso para enviarte una
              cotización según el alcance del servicio.
            </p>
            <div className="mb-3">
              <label className="form-label small">
                ¿Qué necesitas? (opcional)
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe tu requerimiento, empresa, cantidad de trabajadores o necesidad SST..."
              />
            </div>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <button
              type="button"
              className="btn btn-bemc w-100"
              onClick={handleRequest}
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Solicitar cotización'}
            </button>
            <p className="small text-muted mt-2 mb-0">
              No se muestra precio público. La cotización se define después de revisar la solicitud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
