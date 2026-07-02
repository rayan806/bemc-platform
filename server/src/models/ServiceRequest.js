/**
 * Archivo: server/src/models/ServiceRequest.js
 * Proposito: Modelo de solicitudes de servicio y su estado.
 */

import mongoose from 'mongoose';

const STATUSES = [
  'draft',
  'pending_payment',
  'paid',
  'in_progress',
  'completed',
  'cancelled',
];

const serviceRequestSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending_payment',
    },
    clientNotes: { type: String, trim: true },
    internalNotes: { type: String, trim: true },
    assignedConsultor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    scheduledStart: Date,
    scheduledEnd: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
export { STATUSES };
