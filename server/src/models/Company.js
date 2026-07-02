/**
 * Archivo: server/src/models/Company.js
 * Proposito: Modelo de empresas vinculadas a clientes.
 */

import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    legalName: { type: String, required: true, trim: true },
    nit: { type: String, required: true, trim: true, unique: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    legalRepresentative: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Company = mongoose.model('Company', companySchema);
