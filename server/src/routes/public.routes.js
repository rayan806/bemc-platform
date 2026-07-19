/**
 * Archivo: server/src/routes/public.routes.js
 * Proposito: Endpoints publicos de cotizacion para empresas no registradas.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PublicQuote } from '../models/PublicQuote.js';
import { User } from '../models/User.js';
import { ProfessionalCertification } from '../models/ProfessionalCertification.js';
import { ProfessionalDocument } from '../models/ProfessionalDocument.js';
import { MarketplaceRating } from '../models/MarketplaceRating.js';

const router = Router();

router.get('/professionals', async (req, res, next) => {
  try {
    const city = (req.query.city || '').trim().toLowerCase();
    const specialty = (req.query.specialty || '').trim().toLowerCase();

    const professionals = await User.find({
      role: 'professional_sst',
      isActive: true,
      'professionalProfile.availabilityStatus': { $ne: 'unavailable' },
    })
      .select('profile professionalProfile')
      .sort({ 'professionalProfile.ratingAvg': -1, 'professionalProfile.completedServicesCount': -1 })
      .lean();

    const filtered = professionals.filter((p) => {
      const prof = p.professionalProfile || {};
      if (city) {
        const inMainCity = (prof.city || '').toLowerCase() === city;
        const inMunicipality = (prof.serviceMunicipalities || []).map((m) => (m || '').toLowerCase()).includes(city);
        if (!inMainCity && !inMunicipality && !prof.canTravel) return false;
      }
      if (specialty) {
        const specialties = [prof.specialty, ...(prof.specialties || [])].map((s) => (s || '').toLowerCase());
        if (!specialties.some((s) => s.includes(specialty) || specialty.includes(s))) return false;
      }
      return true;
    });

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

router.get('/professionals/:id', async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'professional_sst', isActive: true })
      .select('profile professionalProfile')
      .lean();
    if (!user) return res.status(404).json({ message: 'Profesional no encontrado' });

    const [certifications, documents, ratings] = await Promise.all([
      ProfessionalCertification.find({ professional: user._id })
        .select('title type issuedAt expiresAt isVerified')
        .sort({ createdAt: -1 })
        .lean(),
      ProfessionalDocument.find({ professional: user._id })
        .select('name type expiresAt status')
        .sort({ createdAt: -1 })
        .lean(),
      MarketplaceRating.find({ toUser: user._id, type: 'company_to_professional' })
        .populate('fromUser', 'profile')
        .select('score comment createdAt fromUser')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      _id: user._id,
      profile: user.profile,
      professionalProfile: user.professionalProfile,
      certifications,
      documents,
      companyComments: ratings.map((r) => ({
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        companyName: `${r.fromUser?.profile?.firstName || ''} ${r.fromUser?.profile?.lastName || ''}`.trim(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

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
