/**
 * Archivo: server/src/utils/audit.js
 * Proposito: Utilidad para registrar eventos de auditoria.
 */

import { AuditLog } from '../models/AuditLog.js';

export async function logAudit({ user, action, entity, entityId, changes, req }) {
  try {
    await AuditLog.create({
      user: user?._id || user,
      action,
      entity,
      entityId,
      changes,
      ip: req?.ip,
      userAgent: req?.get?.('user-agent'),
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}
