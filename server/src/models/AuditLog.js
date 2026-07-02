/**
 * Archivo: server/src/models/AuditLog.js
 * Proposito: Modelo de auditoria para trazabilidad.
 */

import mongoose from 'mongoose';

// Define la estructura de datos que se guarda en MongoDB.
const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    changes: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
