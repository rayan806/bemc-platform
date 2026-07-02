/**
 * Archivo: server/src/routes/requests.routes.js
 * Proposito: Rutas para crear y administrar solicitudes.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Service } from '../models/Service.js';
import { Payment } from '../models/Payment.js';
import { authenticate, isStaff } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

// Aqui se definen los endpoints de este modulo.

// Desde este punto todas las rutas requieren sesion iniciada.
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const staffRoles = ['admin', 'consultor', 'auxiliar', 'supervisor'];
    if (!staffRoles.includes(req.user.role)) {
      filter.client = req.user._id;
    } else if (req.query.clientId) {
      filter.client = req.query.clientId;
    }
    if (req.query.status) filter.status = req.query.status;

    const requests = await ServiceRequest.find(filter)
      .populate('client', 'email profile accountType')
      .populate('company')
      .populate('service')
      .populate('assignedConsultor', 'email profile')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('client', 'email profile accountType')
      .populate('company')
      .populate('service')
      .populate('assignedConsultor', 'email profile');

    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const staffRoles = ['admin', 'consultor', 'auxiliar', 'supervisor'];
    if (
      !staffRoles.includes(req.user.role) &&
      request.client._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const payments = await Payment.find({ serviceRequest: request._id });
    res.json({ request, payments });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('serviceId').notEmpty(),
    body('clientNotes').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const service = await Service.findById(req.body.serviceId);
      if (!service?.isActive) {
        return res.status(404).json({ message: 'Servicio no disponible' });
      }

      const serviceRequest = await ServiceRequest.create({
        client: req.user._id,
        company: req.user.company || undefined,
        service: service._id,
        clientNotes: req.body.clientNotes,
        status: 'pending_payment',
      });

      await Payment.create({
        serviceRequest: serviceRequest._id,
        client: req.user._id,
        amount: service.price,
        currency: service.currency,
        status: 'pending',
      });

      await logAudit({
        user: req.user,
        action: 'create',
        entity: 'ServiceRequest',
        entityId: serviceRequest._id,
        req,
      });

      const populated = await ServiceRequest.findById(serviceRequest._id)
        .populate('service')
        .populate('company');

      res.status(201).json(populated);
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', isStaff, async (req, res, next) => {
  try {
    const allowed = [
      'status',
      'internalNotes',
      'assignedConsultor',
      'scheduledStart',
      'scheduledEnd',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'email profile')
      .populate('service')
      .populate('assignedConsultor', 'email profile');

    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

    if (updates.status === 'completed') {
      request.completedAt = new Date();
      await request.save();
    }

    await logAudit({
      user: req.user,
      action: 'update',
      entity: 'ServiceRequest',
      entityId: request._id,
      changes: updates,
      req,
    });

    res.json(request);
  } catch (err) {
    next(err);
  }
});

export default router;
