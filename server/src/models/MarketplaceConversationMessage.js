/**
 * Archivo: server/src/models/MarketplaceConversationMessage.js
 * Proposito: Mensajes entre empresa y profesional por solicitud de marketplace.
 */

import mongoose from 'mongoose';

const marketplaceConversationMessageSchema = new mongoose.Schema(
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
    companyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

marketplaceConversationMessageSchema.index({ request: 1, professional: 1, createdAt: 1 });

export const MarketplaceConversationMessage = mongoose.model(
  'MarketplaceConversationMessage',
  marketplaceConversationMessageSchema
);
