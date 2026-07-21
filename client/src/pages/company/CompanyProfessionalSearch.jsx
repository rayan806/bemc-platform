import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import LocationAutocomplete from '../../components/locations/LocationAutocomplete';

function formatRating(value) {
  return Number(value || 0).toFixed(1);
}

export default function CompanyProfessionalSearch() {
  const [filters, setFilters] = useState({
    cityLocation: null,
    type: '',
    specialty: '',
    minYearsExperience: 0,
    minRating: 0,
    requiresSstLicense: false,
    requiresWorkingAtHeights: false,
    requiresConfinedSpaces: false,
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.cityLocation?.cityCode) params.cityCode = currentFilters.cityLocation.cityCode;
      if (currentFilters.cityLocation?.cityName) params.city = currentFilters.cityLocation.cityName;
      if (currentFilters.type) params.type = currentFilters.type;
      if (currentFilters.specialty) params.specialty = currentFilters.specialty;
      if (Number(currentFilters.minYearsExperience || 0) > 0) params.minYearsExperience = Number(currentFilters.minYearsExperience);
      if (Number(currentFilters.minRating || 0) > 0) params.minRating = Number(currentFilters.minRating);
      if (currentFilters.requiresSstLicense) params.requiresSstLicense = true;
      if (currentFilters.requiresWorkingAtHeights) params.requiresWorkingAtHeights = true;
      if (currentFilters.requiresConfinedSpaces) params.requiresConfinedSpaces = true;

      const { data } = await api.get('/marketplace/professionals/public', { params });
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, []);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 className="h4 mb-1">Buscar profesionales</h2>
          <p className="text-muted mb-0">Encuentra perfiles disponibles sin publicar una solicitud.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={() => load(filters)}>Buscar</button>
      </div>

      <div className="card card-bemc p-3 mb-3">
        <div className="row g-3">
          <div className="col-md-4">
            <LocationAutocomplete
              type="city"
              label="Ciudad"
              placeholder="Filtrar por ciudad"
              value={filters.cityLocation}
              onChange={(option) => setFilters((prev) => ({ ...prev, cityLocation: option }))}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Tipo de profesional</label>
            <input className="form-control" value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))} placeholder="Ej. Profesional SST" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Especialidad o servicio</label>
            <input className="form-control" value={filters.specialty} onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))} placeholder="Ej. Alturas, SG-SST" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Experiencia mínima</label>
            <input type="number" min="0" className="form-control" value={filters.minYearsExperience} onChange={(e) => setFilters((prev) => ({ ...prev, minYearsExperience: e.target.value }))} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Calificación mínima</label>
            <input type="number" min="0" max="5" step="0.1" className="form-control" value={filters.minRating} onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))} />
          </div>
          <div className="col-md-6 d-flex flex-wrap gap-3 align-items-end">
            <label className="form-check"><input className="form-check-input" type="checkbox" checked={filters.requiresSstLicense} onChange={(e) => setFilters((prev) => ({ ...prev, requiresSstLicense: e.target.checked }))} /> <span className="form-check-label">Licencia SST vigente</span></label>
            <label className="form-check"><input className="form-check-input" type="checkbox" checked={filters.requiresWorkingAtHeights} onChange={(e) => setFilters((prev) => ({ ...prev, requiresWorkingAtHeights: e.target.checked }))} /> <span className="form-check-label">Trabajo en alturas</span></label>
            <label className="form-check"><input className="form-check-input" type="checkbox" checked={filters.requiresConfinedSpaces} onChange={(e) => setFilters((prev) => ({ ...prev, requiresConfinedSpaces: e.target.checked }))} /> <span className="form-check-label">Espacios confinados</span></label>
          </div>
        </div>
      </div>

      {loading ? <div className="spinner-border text-primary" /> : (
        <div className="row g-3">
          {rows.map((pro) => (
            <div className="col-xl-6" key={pro._id}>
              <div className="card card-bemc p-3 h-100">
                <div className="d-flex gap-3 align-items-center mb-2">
                  {pro.profile?.avatarUrl ? (
                    <img src={pro.profile.avatarUrl} alt="perfil" width="64" height="64" style={{ objectFit: 'cover', borderRadius: 10 }} />
                  ) : (
                    <div className="bg-light border rounded" style={{ width: 64, height: 64 }} />
                  )}
                  <div>
                    <div className="fw-semibold">{pro.profile?.firstName || ''} {pro.profile?.lastName || ''}</div>
                    <div className="small text-muted">{pro.professionalProfile?.mainProfession || 'Profesional SST'}</div>
                    <div className="small text-muted">{pro.profile?.city || pro.professionalProfile?.city || 'Ciudad no definida'}</div>
                  </div>
                </div>

                <div className="row g-2 small mb-3">
                  <div className="col-6"><span className="text-muted">Experiencia:</span> {pro.professionalProfile?.yearsExperience || 0} años</div>
                  <div className="col-6"><span className="text-muted">Rating:</span> {formatRating(pro.professionalProfile?.ratingAvg)}</div>
                  <div className="col-6"><span className="text-muted">Servicios:</span> {pro.professionalProfile?.completedServicesCount || 0}</div>
                  <div className="col-6"><span className="text-muted">Disponibilidad:</span> {pro.professionalProfile?.availabilityStatus || 'available'}</div>
                </div>

                <div className="small text-muted mb-3">{(pro.professionalProfile?.servicesOffered || []).slice(0, 4).join(', ') || 'Sin servicios declarados'}</div>

                <div className="d-flex gap-2 mt-auto">
                  <Link className="btn btn-sm btn-outline-primary" to={`/profesionales-sst/${pro._id}`}>Ver perfil</Link>
                  <Link className="btn btn-sm btn-outline-secondary" to="/empresa/crear-solicitud">Publicar solicitud</Link>
                </div>
              </div>
            </div>
          ))}
          {!rows.length ? <div className="col-12"><div className="alert alert-light border mb-0">No hay profesionales compatibles con esos filtros.</div></div> : null}
        </div>
      )}
    </div>
  );
}