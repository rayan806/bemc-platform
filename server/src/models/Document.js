/**
 * Archivo: server/src/models/Document.js
 * Proposito: Modelo de documentos adjuntos y versionado.
 */

import mongoose from 'mongoose';

const DOCUMENT_CATEGORIES = [
  'informe-sst',
  'certificado',
  'acta',
  'evidencia',
  'contrato',
  'capacitacion',
  'auditoria',
  'comprobante',
  'otro',
];

const documentSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, default: 'otro' },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    version: { type: Number, default: 1 },
    previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    isApproved: { type: Boolean, default: null },
    reviewNotes: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
export { DOCUMENT_CATEGORIES };
