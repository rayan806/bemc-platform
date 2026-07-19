/**
 * Archivo: server/src/routes/notifications.routes.js
 * Proposito: Endpoints de notificaciones internas para usuarios autenticados.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notificacion no encontrada' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ message: 'Notificaciones marcadas como leidas' });
  } catch (err) {
    next(err);
  }
});

export default router;
