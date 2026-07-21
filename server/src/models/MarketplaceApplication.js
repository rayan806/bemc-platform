/**
 * Archivo: server/src/models/MarketplaceApplication.js
 * Proposito: Postulaciones de profesionales a solicitudes Marketplace.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_APPLICATION_STATUSES = ['active', 'rejected', 'selected', 'closed'];

const marketplaceApplicationSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceRequest',
      required: true,
      index: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    availabilityNote: { type: String, trim: true },
    economicProposal: { type: Number, min: 0, required: true },
    observations: { type: String, trim: true },
    contractFileUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: MARKETPLACE_APPLICATION_STATUSES,
      default: 'active',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketplaceApplicationSchema.index({ request: 1, professional: 1 }, { unique: true });

export const MarketplaceApplication = mongoose.model(
  'MarketplaceApplication',
  marketplaceApplicationSchema
);
