/**
 * Archivo: server/src/models/Payment.js
 * Proposito: Modelo de pagos asociados a solicitudes.
 */

import mongoose from 'mongoose';

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'overdue'];
const PAYMENT_METHODS = ['card', 'pse', 'transfer', 'cash', 'other'];

const paymentSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'COP' },
    method: { type: String, enum: PAYMENT_METHODS, default: 'transfer' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    reference: { type: String, trim: true },
    proofFileUrl: { type: String },
    paidAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
export { PAYMENT_STATUSES, PAYMENT_METHODS };
