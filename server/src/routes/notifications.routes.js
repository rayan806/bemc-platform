/**
 * Archivo: server/src/routes/notifications.routes.js
 * Proposito: Endpoints de notificaciones internas para usuarios autenticados.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { MarketplaceApplication } from '../models/MarketplaceApplication.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    if (req.user.role !== 'professional_sst') {
      return res.json(notifications);
    }

    const requestNotificationTypes = ['marketplace_match', 'marketplace_reopened'];
    const requestIds = notifications
      .filter((n) => requestNotificationTypes.includes(n.type) && n?.payload?.requestId)
      .map((n) => n.payload.requestId.toString());

    if (!requestIds.length) {
      return res.json(notifications);
    }

    const [rejectedRows, respondedIds] = await Promise.all([
      MarketplaceRequest.find({
        _id: { $in: requestIds },
        rejectedProfessionals: req.user._id,
      }).select('_id'),
      MarketplaceApplication.find({
        professional: req.user._id,
        request: { $in: requestIds },
      }).distinct('request'),
    ]);

    const blockedIds = new Set([
      ...rejectedRows.map((row) => row._id.toString()),
      ...respondedIds.map((id) => id.toString()),
    ]);

    if (!blockedIds.size) {
      return res.json(notifications);
    }

    const filtered = notifications.filter((n) => {
      if (!requestNotificationTypes.includes(n.type)) return true;
      const requestId = n?.payload?.requestId?.toString();
      return !requestId || !blockedIds.has(requestId);
    });

    await Notification.deleteMany({
      user: req.user._id,
      type: { $in: requestNotificationTypes },
      'payload.requestId': { $in: Array.from(blockedIds) },
    });

    res.json(filtered);
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
