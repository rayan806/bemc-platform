import { useState } from 'react';
import api from '../api/client';

export default function PublicCompanyQuotePage() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    workersCount: 1,
    serviceNeed: '',
    message: '',
  });
  const [msg, setMsg] = useState('');

  const send = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const { data } = await api.post('/public/quotes', { ...form, workersCount: Number(form.workersCount) });
      setMsg(data.message || 'Solicitud enviada');
    } catch (err) {
      setMsg(err.response?.data?.message || 'No se pudo enviar la solicitud');
    }
  };

  return (
    <section className="container py-5">
      <h1 className="h2 mb-3">Cotizacion para empresas</h1>
      <p className="text-muted">Conoce nuestros servicios y solicita una cotizacion sin registrarte.</p>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form className="row g-2" onSubmit={send}>
        <div className="col-md-6"><input className="form-control" placeholder="Empresa" required value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Contacto" required value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" type="email" placeholder="Correo" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Telefono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Ciudad" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
        <div className="col-md-4"><input type="number" min="1" className="form-control" placeholder="Numero de trabajadores" value={form.workersCount} onChange={(e) => setForm((p) => ({ ...p, workersCount: e.target.value }))} /></div>
        <div className="col-md-8"><input className="form-control" placeholder="Necesidad del servicio" required value={form.serviceNeed} onChange={(e) => setForm((p) => ({ ...p, serviceNeed: e.target.value }))} /></div>
        <div className="col-12"><textarea className="form-control" rows="4" placeholder="Describe tu proyecto" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} /></div>
        <div className="col-12"><button className="btn btn-bemc" type="submit">Solicitar cotizacion</button></div>
      </form>
    </section>
  );
}
