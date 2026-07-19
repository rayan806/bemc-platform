import { useState } from 'react';
import api from '../../api/client';

export default function CompanyCreateRequest() {
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    department: '',
    address: '',
    startDate: '',
    estimatedEndDate: '',
    requiredProfessionalType: '',
    requiredService: '',
    minYearsExperience: 0,
    workersCount: 1,
    riskLevel: 'medio',
    schedule: '',
    requiresWorkingAtHeights: false,
    requiresConfinedSpaces: false,
    requiresImmediateAvailability: false,
    description: '',
    attachmentsText: '',
    publishNow: true,
  });
  const [msg, setMsg] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/marketplace/requests', {
        ...form,
        workersCount: Number(form.workersCount),
        attachments: form.attachmentsText.split('\n').map((v) => v.trim()).filter(Boolean),
      });
      setMsg('Solicitud creada correctamente');
    } catch (err) {
      setMsg(err.response?.data?.message || 'No se pudo crear la solicitud');
    }
  };

  return (
    <div>
      <h2 className="h4 mb-3">Crear solicitud</h2>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form className="row g-2" onSubmit={save}>
        <div className="col-md-4"><input className="form-control" placeholder="Nombre de contacto" required value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Telefono" required value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" type="email" placeholder="Correo" required value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Ciudad" required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Departamento" required value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Direccion" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Tipo de profesional" required value={form.requiredProfessionalType} onChange={(e) => setForm((p) => ({ ...p, requiredProfessionalType: e.target.value }))} /></div>
        <div className="col-md-3"><input className="form-control" placeholder="Servicio requerido" value={form.requiredService} onChange={(e) => setForm((p) => ({ ...p, requiredService: e.target.value }))} /></div>
        <div className="col-md-2"><input type="number" className="form-control" min="0" placeholder="Exp mín (años)" value={form.minYearsExperience} onChange={(e) => setForm((p) => ({ ...p, minYearsExperience: e.target.value }))} /></div>
        <div className="col-md-3"><input type="number" className="form-control" min="1" value={form.workersCount} onChange={(e) => setForm((p) => ({ ...p, workersCount: e.target.value }))} /></div>
        <div className="col-md-3"><input type="date" className="form-control" required value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
        <div className="col-md-3"><input type="date" className="form-control" value={form.estimatedEndDate} onChange={(e) => setForm((p) => ({ ...p, estimatedEndDate: e.target.value }))} /></div>
        <div className="col-md-3"><select className="form-select" value={form.riskLevel} onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}><option value="bajo">Riesgo bajo</option><option value="medio">Riesgo medio</option><option value="alto">Riesgo alto</option></select></div>
        <div className="col-md-3"><input className="form-control" placeholder="Horario" value={form.schedule} onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))} /></div>
        <div className="col-md-3 form-check ms-2"><input className="form-check-input" id="alturas2" type="checkbox" checked={form.requiresWorkingAtHeights} onChange={(e) => setForm((p) => ({ ...p, requiresWorkingAtHeights: e.target.checked }))} /><label className="form-check-label" htmlFor="alturas2">Trabajo en alturas</label></div>
        <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="conf2" type="checkbox" checked={form.requiresConfinedSpaces} onChange={(e) => setForm((p) => ({ ...p, requiresConfinedSpaces: e.target.checked }))} /><label className="form-check-label" htmlFor="conf2">Espacios confinados</label></div>
        <div className="col-md-4 form-check ms-2"><input className="form-check-input" id="inm2" type="checkbox" checked={form.requiresImmediateAvailability} onChange={(e) => setForm((p) => ({ ...p, requiresImmediateAvailability: e.target.checked }))} /><label className="form-check-label" htmlFor="inm2">Disponibilidad inmediata</label></div>
        <div className="col-12"><textarea className="form-control" rows="3" placeholder="Descripcion" required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
        <div className="col-12"><textarea className="form-control" rows="2" placeholder="Documentos adjuntos (URL por linea)" value={form.attachmentsText} onChange={(e) => setForm((p) => ({ ...p, attachmentsText: e.target.value }))} /></div>
        <div className="col-12"><button type="submit" className="btn btn-bemc btn-sm">Guardar solicitud</button></div>
      </form>
    </div>
  );
}
