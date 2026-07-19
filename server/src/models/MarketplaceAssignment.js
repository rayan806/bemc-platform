/**
 * Archivo: server/src/models/MarketplaceAssignment.js
 * Proposito: Asignacion oficial entre empresa, solicitud y profesional SST.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_ASSIGNMENT_STATUSES = ['assigned', 'in_execution', 'finished', 'cancelled'];

const marketplaceAssignmentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceRequest',
      required: true,
      unique: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    agreedValue: { type: Number, min: 0, required: true },
    status: {
      type: String,
      enum: MARKETPLACE_ASSIGNMENT_STATUSES,
      default: 'assigned',
      index: true,
    },
    finalCertificateUrl: { type: String, trim: true },
    finalReportUrl: { type: String, trim: true },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

export const MarketplaceAssignment = mongoose.model(
  'MarketplaceAssignment',
  marketplaceAssignmentSchema
);
