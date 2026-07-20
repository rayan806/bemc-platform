/**
 * Archivo: server/src/models/User.js
 * Proposito: Modelo de usuarios y metodos de autenticacion.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['admin', 'consultor', 'auxiliar', 'supervisor', 'client', 'professional_sst'];

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
      enum: ['person', 'company', 'professional'],
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
      birthDate: { type: Date },
      gender: { type: String, trim: true },
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      department: { type: String, trim: true },
      cityCode: { type: String, trim: true },
      departmentCode: { type: String, trim: true },
      countryCode: { type: String, trim: true, default: 'CO' },
      bio: { type: String, trim: true },
      avatarUrl: { type: String },
    },
    professionalProfile: {
      mainProfession: { type: String, trim: true },
      mainRole: { type: String, trim: true },
      specialty: { type: String, trim: true },
      yearsExperience: { type: Number, min: 0, default: 0 },
      experienceSummary: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
      licenseIssuedAt: { type: Date },
      licenseExpiryDate: { type: Date },
      licenseStatus: {
        type: String,
        enum: ['valid', 'expired', 'suspended', 'pending'],
        default: 'pending',
      },
      licenses: [
        {
          name: { type: String, trim: true },
          number: { type: String, trim: true },
          expiryDate: { type: Date },
        },
      ],
      workExperiences: [
        {
          company: { type: String, trim: true },
          role: { type: String, trim: true },
          startDate: { type: Date },
          endDate: { type: Date },
          functions: { type: String, trim: true },
          city: { type: String, trim: true },
        },
      ],
      studies: [
        {
          title: { type: String, trim: true },
          institution: { type: String, trim: true },
          year: { type: Number, min: 1900 },
        },
      ],
      educationItems: [
        {
          level: { type: String, trim: true },
          title: { type: String, trim: true },
          institution: { type: String, trim: true },
          startDate: { type: Date },
          endDate: { type: Date },
          city: { type: String, trim: true },
        },
      ],
      areasExperience: [{ type: String, trim: true }],
      servicesOffered: [{ type: String, trim: true }],
      specialties: [{ type: String, trim: true }],
      city: { type: String, trim: true },
      department: { type: String, trim: true },
      cityCode: { type: String, trim: true },
      departmentCode: { type: String, trim: true },
      serviceMunicipalities: [{ type: String, trim: true }],
      serviceDepartments: [{ type: String, trim: true }],
      serviceMunicipalityCodes: [{ type: String, trim: true }],
      serviceDepartmentCodes: [{ type: String, trim: true }],
      canTravel: { type: Boolean, default: false },
      immediateAvailability: { type: Boolean, default: false },
      availabilityStatus: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available',
      },
      ratingAvg: { type: Number, default: 0 },
      completedServicesCount: { type: Number, default: 0 },
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
