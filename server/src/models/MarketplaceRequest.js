/**
 * Archivo: server/src/models/MarketplaceRequest.js
 * Proposito: Solicitudes de empresas para contratar profesionales SST.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_REQUEST_STATUSES = [
  'draft',
  'published',
  'in_postulation',
  'professional_selected',
  'in_execution',
  'finished',
  'cancelled',
];

export const MARKETPLACE_REQUIRED_AVAILABILITY = [
  'immediate',
  'this_week',
  'next_week',
  'specific_date',
];

const marketplaceRequestSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    startDate: { type: Date, required: true },
    estimatedEndDate: { type: Date },
    requiredProfessionalType: { type: String, required: true, trim: true },
    requiredService: { type: String, trim: true },
    minYearsExperience: { type: Number, min: 0, default: 0 },
    workersCount: { type: Number, min: 1, required: true },
    riskLevel: { type: String, trim: true },
    schedule: { type: String, trim: true },
    requiresWorkingAtHeights: { type: Boolean, default: false },
    requiresConfinedSpaces: { type: Boolean, default: false },
    requiresImmediateAvailability: { type: Boolean, default: false },
    requiredAvailability: {
      type: String,
      enum: MARKETPLACE_REQUIRED_AVAILABILITY,
      default: 'immediate',
    },
    budgetReference: { type: Number, min: 0 },
    requiredSpecialties: [{ type: String, trim: true }],
    description: { type: String, required: true, trim: true },
    attachments: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: MARKETPLACE_REQUEST_STATUSES,
      default: 'draft',
      index: true,
    },
    selectedProfessional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    selectedAt: { type: Date },
  },
  { timestamps: true }
);

marketplaceRequestSchema.index({ city: 1, department: 1, status: 1 });
marketplaceRequestSchema.index({ requiredProfessionalType: 1, status: 1 });

export const MarketplaceRequest = mongoose.model('MarketplaceRequest', marketplaceRequestSchema);
