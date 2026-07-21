/**
 * Archivo: client/src/components/NotificationsMenu.jsx
 * Proposito: Menu de notificaciones in-app para usuarios autenticados.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { user, isProfessional } = useAuth();
  const POLL_MS = 5000;
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
    const interval = setInterval(() => loadNotifications(true), POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFocus = () => loadNotifications(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (open) loadNotifications(true);
  }, [open]);

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

  const getNotificationTarget = (notification) => {
    const payload = notification?.payload || {};
    const params = new URLSearchParams();

    if (payload.requestId) params.set('requestId', payload.requestId);
    if (payload.professionalId) params.set('professionalId', payload.professionalId);
    if (payload.assignmentId) params.set('assignmentId', payload.assignmentId);
    if (payload.applicationId) params.set('applicationId', payload.applicationId);

    if (user?.role === 'client') {
      if (['new_application', 'assignment_accepted'].includes(notification.type)) {
        if (payload.professionalId) {
          const query = params.toString();
          return query
            ? `/profesionales-sst/${payload.professionalId}?${query}`
            : `/profesionales-sst/${payload.professionalId}`;
        }

        const query = params.toString();
        return query ? `/empresa/postulaciones?${query}` : '/empresa/postulaciones';
      }

      if (notification.type === 'new_marketplace_report') {
        const query = params.toString();
        return query ? `/empresa/servicios?${query}` : '/empresa/servicios';
      }
    }

    if (isProfessional) {
      if (['marketplace_match', 'marketplace_reopened'].includes(notification.type)) {
        const query = params.toString();
        return query ? `/profesional/solicitudes?${query}` : '/profesional/solicitudes';
      }

      if (['selected_professional', 'vacancy_closed'].includes(notification.type)) {
        const query = params.toString();
        return query ? `/profesional/servicios?${query}` : '/profesional/servicios';
      }
    }

    return null;
  };

  const openNotification = async (notification) => {
    const target = getNotificationTarget(notification);

    if (!notification.readAt) {
      await markOneAsRead(notification._id);
    }

    setOpen(false);
    if (target) navigate(target);
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
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  className={`notif-item ${n.readAt ? 'is-read' : 'is-unread'} text-start w-100 border-0 bg-transparent`}
                  onClick={() => openNotification(n)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openNotification(n);
                    }
                  }}
                >
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
                      onClick={(event) => {
                        event.stopPropagation();
                        markOneAsRead(n._id);
                      }}
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
