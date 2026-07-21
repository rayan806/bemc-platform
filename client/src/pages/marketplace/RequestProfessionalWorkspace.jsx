import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function formatDate(value) {
  if (!value) return 'No definida';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No definida' : date.toLocaleDateString('es-CO');
}

function fullName(profile = {}) {
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Profesional SST';
}

export default function RequestProfessionalWorkspace() {
  const { user } = useAuth();
  const { requestId, professionalId } = useParams();

  const resolvedProfessionalId = professionalId || user?._id || user?.id || '';
  const endpointBase = useMemo(() => (
    requestId && resolvedProfessionalId
      ? `/marketplace/request-professional/${requestId}/${resolvedProfessionalId}`
      : ''
  ), [requestId, resolvedProfessionalId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const isCompany = user?.role === 'client';

  const loadDetail = async () => {
    if (!endpointBase) return;
    const { data } = await api.get(endpointBase);
    setDetail(data);
  };

  const loadMessages = async () => {
    if (!endpointBase) return;
    const { data } = await api.get(`${endpointBase}/messages`);
    setMessages(Array.isArray(data) ? data : []);
  };

  const refresh = async () => {
    if (!endpointBase) return;
    setError('');
    setLoading(true);
    try {
      await Promise.all([loadDetail(), loadMessages()]);
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible cargar el espacio de coordinación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [endpointBase]);

  useEffect(() => {
    if (!endpointBase) return;
    const interval = setInterval(() => {
      Promise.all([loadDetail(), loadMessages()]).catch(() => {
        // Evita romper el polling si hay un fallo puntual de red.
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [endpointBase]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageDraft.trim()) return;

    setSendingMessage(true);
    try {
      const { data } = await api.post(`${endpointBase}/messages`, { message: messageDraft.trim() });
      setMessages((prev) => [...prev, data]);
      setMessageDraft('');
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const uploadContract = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadingPdf(true);
    try {
      await api.post(`${endpointBase}/contract-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      await loadDetail();
      alert('Contrato PDF cargado correctamente');
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo subir el contrato PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="card card-bemc p-4">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning">
        {error}
      </div>
    );
  }

  const professional = detail?.professional || {};
  const profile = professional.profile || {};
  const professionalProfile = professional.professionalProfile || {};
  const request = detail?.request || {};
  const application = detail?.application || {};
  const contractUrl = application?.contractFileUrl || detail?.assignment?.contractFileUrl || '';

  return (
    <div className="d-grid gap-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h2 className="h4 mb-0">Espacio empresa - profesional</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={refresh}>Actualizar</button>
          <Link className="btn btn-sm btn-outline-primary" to={isCompany ? '/empresa/postulaciones' : '/profesional/postulaciones'}>
            Volver
          </Link>
        </div>
      </div>

      <div className="card card-bemc p-3">
        <h3 className="h6 mb-3">Datos generales del profesional</h3>
        <div className="row g-2 small">
          <div className="col-md-6"><span className="text-muted">Nombre:</span> {fullName(profile)}</div>
          <div className="col-md-6"><span className="text-muted">Correo:</span> {professional.email || 'No disponible'}</div>
          <div className="col-md-6"><span className="text-muted">Tipo:</span> {professionalProfile.mainProfession || 'Profesional SST'}</div>
          <div className="col-md-6"><span className="text-muted">Ciudad:</span> {profile.city || professionalProfile.city || 'No definida'}</div>
          <div className="col-md-6"><span className="text-muted">Experiencia:</span> {professionalProfile.yearsExperience || 0} anos</div>
          <div className="col-md-6"><span className="text-muted">Licencia SST:</span> {professionalProfile.licenseNumber || 'No registrada'}</div>
        </div>
      </div>

      <div className="card card-bemc p-3">
        <h3 className="h6 mb-3">Solicitud asociada</h3>
        <div className="row g-2 small">
          <div className="col-md-6"><span className="text-muted">Perfil requerido:</span> {request.requiredProfessionalType || 'SST'}</div>
          <div className="col-md-6"><span className="text-muted">Estado:</span> {request.status || 'Sin estado'}</div>
          <div className="col-md-6"><span className="text-muted">Ciudad:</span> {request.city || 'No definida'}</div>
          <div className="col-md-6"><span className="text-muted">Inicio:</span> {formatDate(request.startDate)}</div>
        </div>
      </div>

      <div className="card card-bemc p-3">
        <h3 className="h6 mb-3">Contrato PDF</h3>
        {contractUrl ? (
          <div className="alert alert-success py-2">
            Contrato actual: <a href={contractUrl} target="_blank" rel="noreferrer">Ver PDF</a>
          </div>
        ) : (
          <p className="text-muted small">Aun no hay contrato cargado.</p>
        )}

        {isCompany ? (
          <form className="row g-2 align-items-end" onSubmit={uploadContract}>
            <div className="col-md-8">
              <label className="form-label small">Subir contrato (PDF)</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="form-control"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="col-md-4">
              <button className="btn btn-bemc w-100" type="submit" disabled={!selectedFile || uploadingPdf}>
                {uploadingPdf ? 'Subiendo...' : 'Cargar contrato PDF'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="card card-bemc p-3">
        <h3 className="h6 mb-3">Mensajes empresa - profesional</h3>
        <div className="border rounded p-2 mb-3" style={{ maxHeight: 260, overflowY: 'auto', background: '#fcfcfc' }}>
          {messages.length === 0 ? (
            <p className="text-muted small mb-0">Aun no hay mensajes en este espacio.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`mb-2 ${msg.mine ? 'text-end' : 'text-start'}`}>
                <div className={`d-inline-block rounded px-2 py-1 ${msg.mine ? 'bg-primary text-white' : 'bg-light border'}`}>
                  <div className="small fw-semibold">{msg.senderName}</div>
                  <div className="small">{msg.message}</div>
                  <div className="small opacity-75">{new Date(msg.createdAt).toLocaleString('es-CO')}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="d-flex gap-2" onSubmit={sendMessage}>
          <input
            className="form-control"
            placeholder="Escribe un mensaje"
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            maxLength={2000}
          />
          <button className="btn btn-bemc" type="submit" disabled={sendingMessage || !messageDraft.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
