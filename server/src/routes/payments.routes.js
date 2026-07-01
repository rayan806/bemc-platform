import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Payment } from '../models/Payment.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { authenticate, isStaff } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const staffRoles = ['admin', 'consultor', 'auxiliar', 'supervisor'];
    if (!staffRoles.includes(req.user.role)) {
      filter.client = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;

    const payments = await Payment.find(filter)
      .populate('serviceRequest')
      .populate('client', 'email profile')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/confirm',
  isStaff,
  [body('notes').optional().trim()],
  async (req, res, next) => {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.confirmedBy = req.user._id;
      payment.notes = req.body.notes || payment.notes;
      await payment.save();

      await ServiceRequest.findByIdAndUpdate(payment.serviceRequest, {
        status: 'paid',
      });

      await logAudit({
        user: req.user,
        action: 'confirm_payment',
        entity: 'Payment',
        entityId: payment._id,
        req,
      });

      res.json(payment);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/proof',
  [body('proofFileUrl').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

      if (payment.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      payment.proofFileUrl = req.body.proofFileUrl;
      payment.method = 'transfer';
      await payment.save();

      res.json({ message: 'Comprobante registrado. Pendiente de confirmación.', payment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
