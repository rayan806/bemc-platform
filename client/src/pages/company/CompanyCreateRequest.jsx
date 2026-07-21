import { useMemo, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LocationAutocomplete from '../../components/locations/LocationAutocomplete';

const PROFESSIONAL_OPTIONS = [
  'SISO por dias',
  'SISO tiempo completo',
  'Inspector SST',
  'Profesional SST',
  'Tecnologo SST',
  'Coordinador de Trabajo en Alturas',
  'Auditor SG-SST',
  'Capacitador SST',
  'Investigador de Accidentes',
  'Medico Laboral',
  'Otro',
];

const EXPERIENCE_OPTIONS = [
  { label: 'Sin experiencia especifica', value: 0 },
  { label: '1 ano', value: 1 },
  { label: '2 anos', value: 2 },
  { label: '3 anos', value: 3 },
  { label: '5 anos', value: 5 },
  { label: 'Mas de 5 anos', value: 6 },
];

const DURATION_OPTIONS = [
  { value: '1_day', label: '1 dia', days: 1 },
  { value: '3_days', label: '3 dias', days: 3 },
  { value: '1_week', label: '1 semana', days: 7 },
  { value: '15_days', label: '15 dias', days: 15 },
  { value: '1_month', label: '1 mes', days: 30 },
  { value: '3_months', label: '3 meses', days: 90 },
  { value: 'full_project', label: 'Proyecto completo', days: null },
];

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Inmediata' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'next_week', label: 'Proxima semana' },
  { value: 'specific_date', label: 'Fecha especifica' },
];

function addDays(baseDate, days) {
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CompanyCreateRequest() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    contactName: user?.profile?.firstName || '',
    contactPhone: user?.profile?.phone || '',
    contactEmail: user?.email || '',
    cityLocation: null,
    address: '',
    requiredProfessionalType: '',
    minYearsExperience: 0,
    workersCount: 1,
    riskLevel: 'medio',
    budgetReference: '',
    duration: '1_week',
    requiredAvailability: 'this_week',
    specificDate: '',
    requiresSstLicense: true,
    requiresWorkingAtHeights: false,
    requiresConfinedSpaces: false,
    description: '',
  });
  const [msg, setMsg] = useState('');

  const durationLabel = useMemo(
    () => DURATION_OPTIONS.find((o) => o.value === form.duration)?.label || '1 semana',
    [form.duration]
  );

  const computeDates = () => {
    const today = new Date();
    let start = today;
    if (form.requiredAvailability === 'this_week') start = addDays(today, 3);
    if (form.requiredAvailability === 'next_week') start = addDays(today, 7);
    if (form.requiredAvailability === 'specific_date' && form.specificDate) start = new Date(form.specificDate);

    const duration = DURATION_OPTIONS.find((o) => o.value === form.duration);
    const estimated = duration?.days ? addDays(start, duration.days) : null;

    return {
      startDate: toISODate(start),
      estimatedEndDate: estimated ? toISODate(estimated) : undefined,
    };
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (!form.cityLocation) {
        setMsg('Selecciona una ciudad valida desde la lista');
        return;
      }
      const { startDate, estimatedEndDate } = computeDates();
      const description = form.description?.trim() || `Busqueda de ${form.requiredProfessionalType} para ${form.cityLocation.cityName}.`;

      await api.post('/marketplace/requests', {
        contactName: form.contactName || user?.profile?.firstName || 'Contacto empresa',
        contactPhone: form.contactPhone || user?.profile?.phone || 'Sin telefono',
        contactEmail: form.contactEmail || user?.email,
        cityLocation: form.cityLocation,
        address: form.address,
        startDate,
        estimatedEndDate,
        requiredProfessionalType: form.requiredProfessionalType,
        requiredService: form.requiredProfessionalType,
        minYearsExperience: Number(form.minYearsExperience || 0),
        workersCount: Number(form.workersCount || 1),
        riskLevel: form.riskLevel,
        schedule: durationLabel,
        requiresSstLicense: !!form.requiresSstLicense,
        requiresWorkingAtHeights: form.requiresWorkingAtHeights,
        requiresConfinedSpaces: form.requiresConfinedSpaces,
        requiresImmediateAvailability: form.requiredAvailability === 'immediate',
        requiredAvailability: form.requiredAvailability,
        budgetReference: form.budgetReference ? Number(form.budgetReference) : undefined,
        description,
        publishNow: true,
      });
      setMsg('Busqueda publicada. Estamos mostrando profesionales compatibles.');
      setForm((p) => ({
        ...p,
        cityLocation: null,
        address: '',
        requiredProfessionalType: '',
        minYearsExperience: 0,
        workersCount: 1,
        riskLevel: 'medio',
        budgetReference: '',
        duration: '1_week',
        requiredAvailability: 'this_week',
        specificDate: '',
        requiresSstLicense: true,
        requiresWorkingAtHeights: false,
        requiresConfinedSpaces: false,
        description: '',
      }));
    } catch (err) {
      setMsg(err.response?.data?.message || 'No se pudo publicar la busqueda');
    }
  };

  return (
    <div>
      <h2 className="h4 mb-2">Publicar solicitud</h2>
      <p className="text-muted mb-3">Publica una necesidad y el sistema la enviará a los profesionales compatibles.</p>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form className="card card-bemc p-3 row g-3" onSubmit={save}>
        <div className="col-md-6">
          <label className="form-label">Profesional requerido</label>
          <select className="form-select" required value={form.requiredProfessionalType} onChange={(e) => setForm((p) => ({ ...p, requiredProfessionalType: e.target.value }))}>
            <option value="">Selecciona una opcion</option>
            {PROFESSIONAL_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Experiencia minima requerida</label>
          <select className="form-select" value={form.minYearsExperience} onChange={(e) => setForm((p) => ({ ...p, minYearsExperience: Number(e.target.value) }))}>
            {EXPERIENCE_OPTIONS.map((opt) => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Salario o presupuesto (opcional)</label>
          <input type="number" min="0" className="form-control" placeholder="Ej. 2500000" value={form.budgetReference} onChange={(e) => setForm((p) => ({ ...p, budgetReference: e.target.value }))} />
        </div>

        <div className="col-md-3">
          <label className="form-label">Número de trabajadores</label>
          <input type="number" min="1" className="form-control" value={form.workersCount} onChange={(e) => setForm((p) => ({ ...p, workersCount: e.target.value }))} />
        </div>

        <div className="col-md-3">
          <label className="form-label">Nivel de riesgo</label>
          <select className="form-select" value={form.riskLevel} onChange={(e) => setForm((p) => ({ ...p, riskLevel: e.target.value }))}>
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
            <option value="muy_alto">Muy alto</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Duracion del servicio</label>
          <select className="form-select" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}>
            {DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <LocationAutocomplete
            type="city"
            label="Ciudad"
            placeholder="Ciudad donde se requiere"
            value={form.cityLocation}
            onChange={(option) => setForm((p) => ({ ...p, cityLocation: option }))}
            required
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Direccion del proyecto</label>
          <input className="form-control" placeholder="Direccion (texto libre)" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Disponibilidad requerida</label>
          <select className="form-select" value={form.requiredAvailability} onChange={(e) => setForm((p) => ({ ...p, requiredAvailability: e.target.value }))}>
            {AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="form-text">Usa Inmediata solo si realmente necesitas disponibilidad hoy mismo.</div>
        </div>

        {form.requiredAvailability === 'specific_date' && (
          <div className="col-md-4">
            <label className="form-label">Fecha especifica</label>
            <input type="date" className="form-control" required value={form.specificDate} onChange={(e) => setForm((p) => ({ ...p, specificDate: e.target.value }))} />
          </div>
        )}

        <div className="col-md-4">
          <label className="form-label">Requiere licencia SST vigente</label>
          <select className="form-select" value={form.requiresSstLicense ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, requiresSstLicense: e.target.value === 'yes' }))}>
            <option value="yes">Si</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Trabajo en alturas</label>
          <select className="form-select" value={form.requiresWorkingAtHeights ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, requiresWorkingAtHeights: e.target.value === 'yes' }))}>
            <option value="no">No</option>
            <option value="yes">Si</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Espacios confinados</label>
          <select className="form-select" value={form.requiresConfinedSpaces ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, requiresConfinedSpaces: e.target.value === 'yes' }))}>
            <option value="no">No</option>
            <option value="yes">Si</option>
          </select>
        </div>

        <div className="col-12">
          <label className="form-label">Comentarios</label>
          <textarea className="form-control" rows="3" placeholder="Describe brevemente el servicio o requisitos adicionales" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="col-12">
          <hr className="my-1" />
          <div className="small text-muted mb-2">Datos de contacto de la empresa</div>
        </div>

        <div className="col-md-4"><input className="form-control" placeholder="Nombre de contacto" required value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" placeholder="Telefono" required value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} /></div>
        <div className="col-md-4"><input className="form-control" type="email" placeholder="Correo" required value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} /></div>

        <div className="col-12 d-flex gap-2">
          <button type="submit" className="btn btn-bemc">Publicar solicitud</button>
        </div>
      </form>
    </div>
  );
}
