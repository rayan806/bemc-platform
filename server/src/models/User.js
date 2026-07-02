/**
 * Archivo: server/src/models/User.js
 * Proposito: Modelo de usuarios y metodos de autenticacion.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['admin', 'consultor', 'auxiliar', 'supervisor', 'client'];

// Define la estructura de datos que se guarda en MongoDB.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    authProviders: {
      type: [String],
      enum: ['local', 'facebook', 'google'],
      default: ['local'],
    },
    facebookId: { type: String, sparse: true, unique: true },
    googleId: { type: String, sparse: true, unique: true },
    accountType: {
      type: String,
      enum: ['person', 'company'],
      default: 'person',
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'client',
    },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      documentType: { type: String, trim: true },
      documentNumber: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      avatarUrl: { type: String },
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

export const User = mongoose.model('User', userSchema);
export { ROLES };
