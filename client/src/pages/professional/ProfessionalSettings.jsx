import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalSettings() {
  const [form, setForm] = useState({ availabilityStatus: 'available', immediateAvailability: false, canTravel: false });

  useEffect(() => {
    api.get('/marketplace/professionals/me').then((r) => {
      const p = r.data?.user?.professionalProfile || {};
      setForm({
        availabilityStatus: p.availabilityStatus || 'available',
        immediateAvailability: !!p.immediateAvailability,
        canTravel: !!p.canTravel,
      });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.patch('/marketplace/professionals/me', { professionalProfile: form });
    alert('Configuración guardada');
  };

  return (
    <div>
      <h2 className="h4 mb-3">Configuración</h2>
      <form className="card card-bemc p-3" onSubmit={save}>
        <div className="mb-2"><label className="form-label">Estado de disponibilidad</label><select className="form-select" value={form.availabilityStatus} onChange={(e) => setForm((p) => ({ ...p, availabilityStatus: e.target.value }))}><option value="available">Disponible</option><option value="busy">Ocupado</option><option value="unavailable">No disponible</option></select></div>
        <div className="form-check mb-2"><input className="form-check-input" id="immediate" type="checkbox" checked={form.immediateAvailability} onChange={(e) => setForm((p) => ({ ...p, immediateAvailability: e.target.checked }))} /><label htmlFor="immediate" className="form-check-label">Disponibilidad inmediata</label></div>
        <div className="form-check mb-3"><input className="form-check-input" id="travel" type="checkbox" checked={form.canTravel} onChange={(e) => setForm((p) => ({ ...p, canTravel: e.target.checked }))} /><label htmlFor="travel" className="form-check-label">Aceptar viajes</label></div>
        <button className="btn btn-bemc" type="submit">Guardar</button>
      </form>
    </div>
  );
}
