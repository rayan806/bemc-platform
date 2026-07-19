import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminSettings() {
  const [form, setForm] = useState({
    maintenanceMode: false,
    allowPublicQuotes: true,
    notificationsEnabled: true,
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/admin/system-config').then((r) => setForm(r.data || form));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const { data } = await api.put('/admin/system-config', form);
    setForm(data || form);
    setMsg('Configuracion guardada');
  };

  return (
    <div>
      <h1 className="h3 mb-4">Configuracion del sistema</h1>
      {msg && <div className="alert alert-success">{msg}</div>}
      <form className="card card-bemc p-3" onSubmit={save}>
        <div className="form-check mb-2">
          <input id="maintenanceMode" className="form-check-input" type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm((p) => ({ ...p, maintenanceMode: e.target.checked }))} />
          <label htmlFor="maintenanceMode" className="form-check-label">Modo mantenimiento</label>
        </div>
        <div className="form-check mb-2">
          <input id="allowPublicQuotes" className="form-check-input" type="checkbox" checked={form.allowPublicQuotes} onChange={(e) => setForm((p) => ({ ...p, allowPublicQuotes: e.target.checked }))} />
          <label htmlFor="allowPublicQuotes" className="form-check-label">Permitir cotizaciones publicas</label>
        </div>
        <div className="form-check mb-3">
          <input id="notificationsEnabled" className="form-check-input" type="checkbox" checked={form.notificationsEnabled} onChange={(e) => setForm((p) => ({ ...p, notificationsEnabled: e.target.checked }))} />
          <label htmlFor="notificationsEnabled" className="form-check-label">Notificaciones habilitadas</label>
        </div>
        <button type="submit" className="btn btn-bemc btn-sm">Guardar configuracion</button>
      </form>
    </div>
  );
}
