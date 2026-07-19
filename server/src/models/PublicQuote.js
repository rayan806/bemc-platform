/**
 * Archivo: server/src/models/PublicQuote.js
 * Proposito: Solicitudes publicas de cotizacion para empresas no registradas.
 */

import mongoose from 'mongoose';

const publicQuoteSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    serviceNeed: { type: String, required: true, trim: true },
    workersCount: { type: Number, min: 1 },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ['new', 'in_review', 'contacted', 'closed'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

publicQuoteSchema.index({ status: 1, createdAt: -1 });

export const PublicQuote = mongoose.model('PublicQuote', publicQuoteSchema);
