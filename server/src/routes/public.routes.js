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
import {
  normalizeLocationText,
  resolveCitySelection,
  searchLocations,
} from '../services/locationCatalog.service.js';

const router = Router();

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasCoverage(prof, selectedCity, normalizedCityText) {
  const mode = prof.geographicAvailability || 'city_only';
  const nationwide = mode === 'nationwide' || !!prof.canTravel;
  if (nationwide) return true;

  const byCode =
    !!selectedCity &&
    (prof.cityCode === selectedCity.cityCode || (prof.serviceMunicipalityCodes || []).includes(selectedCity.cityCode));
  const byText =
    normalizeLocationText(prof.city) === normalizedCityText ||
    (prof.serviceMunicipalities || []).map((m) => normalizeLocationText(m)).includes(normalizedCityText);
  const byDepartment =
    !!selectedCity &&
    (prof.departmentCode === selectedCity.departmentCode ||
      (prof.serviceDepartmentCodes || []).includes(selectedCity.departmentCode));

  if (mode === 'city_only' || mode === 'city_nearby') return byCode || byText;
  if (mode === 'department' || mode === 'multi_department') return byDepartment || byCode || byText;
  return byCode || byText;
}

router.get('/locations/search', async (req, res) => {
  const type = req.query.type === 'department' ? 'department' : 'city';
  const query = String(req.query.query || '');
  const departmentCode = req.query.departmentCode ? String(req.query.departmentCode) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 12;

  const rows = searchLocations({ type, query, departmentCode, limit });
  res.json(rows);
});

router.get('/professionals', async (req, res, next) => {
  try {
    const cityCode = String(req.query.cityCode || '').trim();
    const cityText = String(req.query.city || '').trim();
    const selectedCity = cityCode ? resolveCitySelection({ cityCode }) : resolveCitySelection(cityText);
    const normalizedCityText = normalizeLocationText(cityText);
    const specialty = normalize(req.query.specialty);
    const type = normalize(req.query.type);

    const professionals = await User.find({
      role: 'professional_sst',
      isActive: true,
      'professionalProfile.availabilityStatus': 'available',
    })
      .select('profile professionalProfile')
      .sort({ 'professionalProfile.ratingAvg': -1, 'professionalProfile.completedServicesCount': -1 })
      .lean();

    const filtered = professionals.filter((p) => {
      const prof = p.professionalProfile || {};
      if (cityCode || cityText) {
        if (!hasCoverage(prof, selectedCity, normalizedCityText)) return false;
      }
      if (specialty) {
        const specialties = [prof.specialty, ...(prof.specialties || []), ...(prof.servicesOffered || [])]
          .map(normalize)
          .filter(Boolean);
        if (!specialties.some((s) => s.includes(specialty) || specialty.includes(s))) return false;
      }
      if (type) {
        const profession = normalize(prof.mainProfession);
        const mainRole = normalize(prof.mainRole);
        const services = (prof.servicesOffered || []).map(normalize);
        const isSstType = type.includes('sst') || type.includes('seguridad y salud en el trabajo');
        const sstMatch =
          profession.includes('sst') ||
          profession.includes('seguridad y salud en el trabajo') ||
          mainRole.includes('sst') ||
          mainRole.includes('seguridad y salud en el trabajo') ||
          services.some((s) => s.includes('sst') || s.includes('seguridad y salud en el trabajo'));
        if (
          !profession.includes(type) &&
          !mainRole.includes(type) &&
          !services.some((s) => s.includes(type) || type.includes(s)) &&
          !(isSstType && sstMatch)
        ) {
          return false;
        }
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
    body('cityLocation').optional().isObject(),
    body('workersCount').optional().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Datos invalidos', errors: errors.array() });
      }

      const selectedCity = req.body.cityLocation
        ? resolveCitySelection(req.body.cityLocation)
        : resolveCitySelection(req.body.city);

      if (req.body.cityLocation && !selectedCity) {
        return res.status(400).json({ message: 'Selecciona una ciudad valida de la lista' });
      }

      const quote = await PublicQuote.create({
        companyName: req.body.companyName,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        city: selectedCity?.cityName || req.body.city,
        department: selectedCity?.departmentName,
        cityCode: selectedCity?.cityCode,
        departmentCode: selectedCity?.departmentCode,
        countryCode: selectedCity?.countryCode || 'CO',
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
