/**
 * Archivo: server/src/models/MarketplaceRating.js
 * Proposito: Calificaciones cruzadas entre empresa y profesional al finalizar.
 */

import mongoose from 'mongoose';

export const MARKETPLACE_RATING_TYPES = ['company_to_professional', 'professional_to_company'];

const marketplaceRatingSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketplaceAssignment',
      required: true,
      index: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: MARKETPLACE_RATING_TYPES,
      required: true,
    },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

marketplaceRatingSchema.index({ assignment: 1, type: 1 }, { unique: true });

export const MarketplaceRating = mongoose.model('MarketplaceRating', marketplaceRatingSchema);
