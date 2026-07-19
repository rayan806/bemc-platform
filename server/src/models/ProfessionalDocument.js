/**
 * Archivo: server/src/models/ProfessionalDocument.js
 * Proposito: Documentos profesionales del perfil SST.
 */

import mongoose from 'mongoose';

export const PROFESSIONAL_DOCUMENT_TYPES = [
  'licencia_sst',
  'cedula',
  'tarjeta_profesional',
  'hoja_vida',
  'certificado_laboral',
  'certificado_experiencia',
  'certificado_estudio',
  'diplomado',
  'especializacion',
  'maestria',
  'curso_50h',
  'curso_20h',
  'coordinador_alturas',
  'espacios_confinados',
  'primeros_auxilios',
  'otro',
];

const professionalDocumentSchema = new mongoose.Schema(
  {
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: PROFESSIONAL_DOCUMENT_TYPES, default: 'otro', index: true },
    fileUrl: { type: String, required: true, trim: true },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['active', 'expired', 'pending_review'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

professionalDocumentSchema.index({ professional: 1, type: 1, createdAt: -1 });

export const ProfessionalDocument = mongoose.model('ProfessionalDocument', professionalDocumentSchema);
