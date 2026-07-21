import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const labels = {
  active: 'En revision',
  selected: 'Seleccionado',
  rejected: 'Rechazado',
  closed: 'Finalizado',
};

export default function ProfessionalApplications() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/marketplace/applications/mine').then((r) => setRows(r.data || []));
  }, []);

  return (
    <div>
      <h2 className="h4 mb-3">Mis postulaciones</h2>
      <div className="table-responsive">
        <table className="table table-hover bg-white rounded">
          <thead className="table-light"><tr><th>Solicitud</th><th>Empresa</th><th>Valor</th><th>Estado</th><th>Accion</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a._id}>
                <td>{a.request?.requiredProfessionalType || 'SST'}</td>
                <td>{a.request?.company?.legalName || 'Empresa'}</td>
                <td>{a.economicProposal}</td>
                <td>{labels[a.status] || a.status}</td>
                <td>
                  {a.request?._id && (user?._id || user?.id) ? (
                    <Link className="btn btn-sm btn-outline-primary" to={`/profesional/espacio/${a.request._id}/${user?._id || user?.id}`}>
                      Abrir espacio
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
