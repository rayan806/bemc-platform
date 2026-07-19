/**
 * Archivo: server/src/models/MarketplaceReport.js
 * Proposito: Reportes diarios del profesional durante la ejecucion del servicio.
 */

import mongoose from 'mongoose';

const marketplaceReportSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceAssignment',
      required: true,
      index: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportDate: { type: Date, required: true },
    activities: { type: String, required: true, trim: true },
    inspections: { type: String, trim: true },
    evidencePhotos: [{ type: String, trim: true }],
    workedHours: { type: Number, min: 0, required: true },
    observations: { type: String, trim: true },
  },
  { timestamps: true }
);

marketplaceReportSchema.index({ assignment: 1, reportDate: -1 });

export const MarketplaceReport = mongoose.model('MarketplaceReport', marketplaceReportSchema);
