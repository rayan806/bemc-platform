/**
 * Archivo: client/src/components/NotificationsMenu.jsx
 * Proposito: Menu de notificaciones in-app para usuarios autenticados.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';

function formatRelative(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} d`;

  return date.toLocaleDateString('es-CO');
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState('');
  const menuRef = useRef(null);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando notificaciones', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => loadNotifications(true), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const markOneAsRead = async (id) => {
    setBusyId(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    } catch (err) {
      console.error('Error marcando notificacion', err);
    } finally {
      setBusyId('');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, readAt })));
    } catch (err) {
      console.error('Error marcando todas las notificaciones', err);
    }
  };

  return (
    <div className="notif-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm position-relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir notificaciones"
      >
        <i className="bi bi-bell" />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel card shadow-sm border-0">
          <div className="notif-panel__header">
            <strong>Notificaciones</strong>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Marcar todas
            </button>
          </div>

          <div className="notif-panel__body">
            {loading ? (
              <div className="small text-muted">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="small text-muted">No tienes notificaciones.</div>
            ) : (
              items.slice(0, 12).map((n) => (
                <div key={n._id} className={`notif-item ${n.readAt ? 'is-read' : 'is-unread'}`}>
                  <div className="notif-item__top">
                    <span className="notif-item__title">{n.title}</span>
                    <small className="text-muted">{formatRelative(n.createdAt)}</small>
                  </div>
                  <p className="notif-item__message mb-1">{n.message}</p>
                  {!n.readAt && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-decoration-none"
                      disabled={busyId === n._id}
                      onClick={() => markOneAsRead(n._id)}
                    >
                      Marcar como leida
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
