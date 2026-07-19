/**
 * Archivo: server/src/models/ProfessionalCertification.js
 * Proposito: Certificaciones del profesional SST para validacion y matching.
 */

import mongoose from 'mongoose';

export const PROFESSIONAL_CERTIFICATION_TYPES = [
  'licencia_sst',
  'coordinador_alturas',
  'curso_50h',
  'curso_20h',
  'espacios_confinados',
  'primeros_auxilios',
  'otra',
];

const professionalCertificationSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: PROFESSIONAL_CERTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

professionalCertificationSchema.index({ professional: 1, type: 1, title: 1 });

export const ProfessionalCertification = mongoose.model(
  'ProfessionalCertification',
  professionalCertificationSchema
);
