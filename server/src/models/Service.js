/**
 * Archivo: server/src/models/Service.js
 * Proposito: Modelo de servicios SST disponibles.
 */

import mongoose from 'mongoose';

const CATEGORIES = [
  'sg-sst',
  'auditoria',
  'capacitacion',
  'inspeccion',
  'evaluacion-riesgo',
  'consultoria',
  'otro',
];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    category: { type: String, enum: CATEGORIES, default: 'consultoria' },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'COP' },
    duration: { type: String, trim: true },
    requiredDocuments: [{ type: String, trim: true }],
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.pre('save', function generateSlug(next) {
  if (!this.isModified('name') && this.slug) return next();
  this.slug = this.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  next();
});

export const Service = mongoose.model('Service', serviceSchema);
export { CATEGORIES };
