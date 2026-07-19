/**
 * Archivo: server/src/routes/public.routes.js
 * Proposito: Endpoints publicos de cotizacion para empresas no registradas.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PublicQuote } from '../models/PublicQuote.js';

const router = Router();

router.post(
  '/quotes',
  [
    body('companyName').trim().notEmpty(),
    body('contactName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('serviceNeed').trim().notEmpty(),
    body('workersCount').optional().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Datos invalidos', errors: errors.array() });
      }

      const quote = await PublicQuote.create({
        companyName: req.body.companyName,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        city: req.body.city,
        serviceNeed: req.body.serviceNeed,
        workersCount: req.body.workersCount,
        message: req.body.message,
      });

      res.status(201).json({
        message: 'Solicitud de cotizacion enviada. Te contactaremos pronto.',
        quoteId: quote._id,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
