import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/companies')
      .then((res) => setCompanies(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="h3 mb-4">Empresas</h1>
      {loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded">
            <thead className="table-light">
              <tr>
                <th>Razón social</th>
                <th>NIT</th>
                <th>Representante</th>
                <th>Correo</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c._id}>
                  <td>{c.legalName}</td>
                  <td>{c.nit}</td>
                  <td>{c.legalRepresentative}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
