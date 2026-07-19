/**
 * Archivo: server/src/models/Notification.js
 * Proposito: Notificaciones internas dentro de la plataforma.
 */

import mongoose from 'mongoose';

export const NOTIFICATION_CHANNELS = ['in_app'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, default: 'in_app' },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
