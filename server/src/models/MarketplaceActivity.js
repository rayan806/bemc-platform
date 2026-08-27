/**
 * Actividades SST vinculadas al espacio de trabajo de un servicio.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_ACTIVITY_TYPES = [
  'diagnosis',
  'risk_matrix',
  'inspection',
  'training',
  'incident',
  'work_plan',
  'action_plan',
  'indicator',
  'report',
];
export const MARKETPLACE_ACTIVITY_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const marketplaceActivitySchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceAssignment', required: true, index: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    type: { type: String, enum: MARKETPLACE_ACTIVITY_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: MARKETPLACE_ACTIVITY_STATUSES, default: 'pending', index: true },
    dueDate: { type: Date },
    completedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

marketplaceActivitySchema.index({ assignment: 1, dueDate: 1 });

export const MarketplaceActivity = mongoose.model('MarketplaceActivity', marketplaceActivitySchema);
