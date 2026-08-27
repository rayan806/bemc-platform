/**
 * Documentos y evidencias entregados durante un servicio marketplace.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_DELIVERABLE_STATUSES = ['pending', 'approved', 'rejected'];
export const MARKETPLACE_DELIVERABLE_TYPES = [
  'evidence',
  'report',
  'inspection',
  'training',
  'risk_matrix',
  'action_plan',
  'other',
];

const marketplaceDeliverableSchema = new mongoose.Schema(
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
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: MARKETPLACE_DELIVERABLE_TYPES, default: 'other' },
    fileName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, min: 0 },
    status: { type: String, enum: MARKETPLACE_DELIVERABLE_STATUSES, default: 'pending', index: true },
    reviewNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

marketplaceDeliverableSchema.index({ assignment: 1, createdAt: -1 });

export const MarketplaceDeliverable = mongoose.model('MarketplaceDeliverable', marketplaceDeliverableSchema);
