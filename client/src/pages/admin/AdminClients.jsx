/**
 * Archivo: client/src/pages/admin/AdminClients.jsx
 * Proposito: Listado administrativo de clientes.
 */

import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/clients')
      .then((res) => setClients(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="h3 mb-4">Clientes</h1>
      {loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>Teléfono</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id}>
                  <td>
                    {c.profile?.firstName} {c.profile?.lastName}
                  </td>
                  <td>{c.email}</td>
                  <td>{c.accountType === 'company' ? 'Empresa' : 'Persona'}</td>
                  <td>{c.company?.legalName || '—'}</td>
                  <td>{c.profile?.phone || '—'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
