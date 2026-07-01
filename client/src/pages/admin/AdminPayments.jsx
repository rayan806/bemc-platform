import { useEffect, useState } from 'react';
import api from '../../api/client';

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);

  const load = () => {
    api
      .get('/payments')
      .then((res) => setPayments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const confirmPayment = async (id) => {
    setConfirming(id);
    try {
      await api.patch(`/payments/${id}/confirm`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div>
      <h1 className="h3 mb-4">Pagos</h1>
      <p className="text-muted small">
        Confirma pagos por transferencia cuando el cliente suba el comprobante.
      </p>

      {loading ? (
        <div className="spinner-border text-primary" />
      ) : (
        <div className="table-responsive">
          <table className="table table-hover bg-white rounded">
            <thead className="table-light">
              <tr>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.client?.profile?.firstName} {p.client?.profile?.lastName}
                    <div className="small text-muted">{p.client?.email}</div>
                  </td>
                  <td>{formatPrice(p.amount)}</td>
                  <td>
                    <span
                      className={`badge ${p.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>{p.method}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    {p.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={confirming === p._id}
                        onClick={() => confirmPayment(p._id)}
                      >
                        Confirmar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
