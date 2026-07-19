import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function ProfessionalOpportunities() {
  const [rows, setRows] = useState([]);

  const load = () => api.get('/marketplace/opportunities').then((r) => setRows(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const apply = async (id) => {
    const economicProposal = window.prompt('Valor de tu propuesta en COP');
    if (!economicProposal) return;
    const availabilityNote = window.prompt('Disponibilidad');
    const observations = window.prompt('Comentarios');
    await api.post(`/marketplace/requests/${id}/applications`, {
      economicProposal: Number(economicProposal),
      availabilityNote,
      observations,
    });
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-3">Solicitudes disponibles</h2>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Empresa</th><th>Ciudad</th><th>Tipo</th><th>Duracion</th><th>Riesgo</th><th>Trabajadores</th><th>Inicio</th><th>Descripcion</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>{r.company?.legalName || 'Empresa'}</td>
                <td>{r.city}</td>
                <td>{r.requiredProfessionalType}</td>
                <td>{r.estimatedEndDate ? `${new Date(r.startDate).toLocaleDateString('es-CO')} - ${new Date(r.estimatedEndDate).toLocaleDateString('es-CO')}` : 'Segun alcance'}</td>
                <td>{r.riskLevel || 'medio'}</td>
                <td>{r.workersCount}</td>
                <td>{new Date(r.startDate).toLocaleDateString('es-CO')}</td>
                <td className="small" style={{ maxWidth: 220 }}>{r.description}</td>
                <td><button className="btn btn-sm btn-bemc" onClick={() => apply(r._id)}>Postularme</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
