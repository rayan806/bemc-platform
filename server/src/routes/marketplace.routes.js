/**
 * Archivo: server/src/routes/marketplace.routes.js
 * Proposito: Modulo Marketplace SST (solicitudes, postulaciones, asignaciones y seguimiento).
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { authenticate, isStaff } from '../middleware/auth.js';
import { User } from '../models/User.js';
import {
  MarketplaceRequest,
  MARKETPLACE_REQUEST_STATUSES,
  MARKETPLACE_REQUIRED_AVAILABILITY,
} from '../models/MarketplaceRequest.js';
import { MarketplaceApplication } from '../models/MarketplaceApplication.js';
import {
  MarketplaceAssignment,
  MARKETPLACE_ASSIGNMENT_STATUSES,
} from '../models/MarketplaceAssignment.js';
import { MarketplaceReport } from '../models/MarketplaceReport.js';
import { MarketplaceRating } from '../models/MarketplaceRating.js';
import {
  ProfessionalCertification,
  PROFESSIONAL_CERTIFICATION_TYPES,
} from '../models/ProfessionalCertification.js';
import { ProfessionalDocument, PROFESSIONAL_DOCUMENT_TYPES } from '../models/ProfessionalDocument.js';
import { MarketplaceConversationMessage } from '../models/MarketplaceConversationMessage.js';
import { Notification } from '../models/Notification.js';
import { logAudit } from '../utils/audit.js';
import { findMatchingProfessionals } from '../services/marketplaceMatcher.service.js';
import {
  normalizeLocationText,
  resolveCitySelection,
  resolveCitySelections,
  resolveDepartmentSelections,
} from '../services/locationCatalog.service.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsUploadDir = path.join(__dirname, '../../uploads/contracts');

fs.mkdirSync(contractsUploadDir, { recursive: true });

const contractUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, contractsUploadDir),
    filename: (req, file, cb) => {
      const safeOriginal = String(file.originalname || 'contrato.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `contract-${suffix}-${safeOriginal}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || String(file.originalname || '').toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Solo se permiten archivos PDF'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);

function validate(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return true;
  res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
  return false;
}

function isProfessional(user) {
  return user.role === 'professional_sst';
}

function isCompanyClient(user) {
  return user.role === 'client' && !!user.company;
}

function isOperator(user) {
  return user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(user.role) || isStaff(user);
}

function displayNameFromUser(user) {
  return `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || user?.email || 'Usuario';
}

async function resolveWorkspace(req, requestId, professionalId) {
  const request = await MarketplaceRequest.findById(requestId).populate('company').populate('createdBy', 'email profile');
  if (!request) {
    return { error: { status: 404, message: 'Solicitud no encontrada' } };
  }

  const professional = await User.findOne({ _id: professionalId, role: 'professional_sst' })
    .select('email profile professionalProfile')
    .lean();
  if (!professional) {
    return { error: { status: 404, message: 'Profesional no encontrado' } };
  }

  const application = await MarketplaceApplication.findOne({ request: request._id, professional: professionalId });
  const assignment = await MarketplaceAssignment.findOne({ request: request._id, professional: professionalId });

  const ownerCompany = request.createdBy?._id?.toString() === req.user._id.toString();
  const professionalParticipant = req.user.role === 'professional_sst' && req.user._id.toString() === professionalId;

  if (professionalParticipant && !application && !assignment) {
    return { error: { status: 403, message: 'No tienes acceso a este espacio' } };
  }

  if (!ownerCompany && !professionalParticipant && !isOperator(req.user)) {
    return { error: { status: 403, message: 'Sin permisos' } };
  }

  return { request, professional, application, assignment, ownerCompany, professionalParticipant };
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isSstText(value) {
  const text = normalize(value);
  return (
    text.includes('siso') ||
    text.includes('sst') ||
    text.includes('sg-sst') ||
    text.includes('seguridad industrial') ||
    text.includes('seguridad y salud en el trabajo') ||
    text.includes('salud ocupacional')
  );
}

function hasCityCoverage(prof, selectedCity, normalizedCityText) {
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

function matchesRequestedType(prof, requiredType) {
  if (!requiredType) return true;
  const profession = normalize(prof.mainProfession);
  const mainRole = normalize(prof.mainRole);
  const services = (prof.servicesOffered || []).map(normalize);
  const isSstRequired = isSstText(requiredType);
  const sstMatch = isSstText(profession) || isSstText(mainRole) || services.some((s) => isSstText(s));
  return (
    profession.includes(requiredType) ||
    mainRole.includes(requiredType) ||
    services.some((s) => s.includes(requiredType) || requiredType.includes(s)) ||
    (isSstRequired && sstMatch)
  );
}

async function findImmediateCityProfessionals(request) {
  const selectedCity = resolveCitySelection({ cityCode: request.cityCode }) || resolveCitySelection(request.city);
  const normalizedCityText = normalizeLocationText(request.city || '');
  if (!selectedCity && !normalizedCityText) return [];

  const requiredType = normalize(request.requiredProfessionalType || request.requiredService);

  const professionals = await User.find({
    role: 'professional_sst',
    isActive: true,
    'professionalProfile.availabilityStatus': 'available',
  })
    .select('profile professionalProfile')
    .lean();

  return professionals.filter((pro) => {
    const prof = pro.professionalProfile || {};
    const exactCityByCode = !!selectedCity && prof.cityCode === selectedCity.cityCode;
    const exactCityByText = normalizeLocationText(prof.city) === normalizedCityText;
    if (!exactCityByCode && !exactCityByText) return false;
    if (!hasCityCoverage(prof, selectedCity, normalizedCityText)) return false;
    if (!matchesRequestedType(prof, requiredType)) return false;
    return true;
  });
}

async function notifyUser(userId, type, title, message, payload = {}) {
  await Notification.create({ user: userId, type, title, message, payload, channel: 'in_app' });
}

function buildRequestNotificationPayload(request, extra = {}) {
  return {
    requestId: request._id,
    companyName: request.company?.legalName || '',
    city: request.city || '',
    requiredProfessionalType: request.requiredProfessionalType || '',
    duration: request.schedule || '',
    startDate: request.startDate,
    riskLevel: request.riskLevel || '',
    ...extra,
  };
}

function buildProfessionalMatchMessage(request) {
  const parts = [
    request.requiredProfessionalType || 'Servicio SST',
    request.city || 'Ubicacion por definir',
    request.schedule || '',
    request.startDate ? `Inicio ${new Date(request.startDate).toLocaleDateString('es-CO')}` : '',
    request.riskLevel ? `Riesgo ${request.riskLevel}` : '',
  ].filter(Boolean);

  return parts.join(' · ');
}

async function notifyCompatibleProfessionals(
  request,
  {
    type = 'marketplace_match',
    title = 'Nueva solicitud compatible',
    message = 'Existe una solicitud que coincide con tu perfil profesional SST.',
  } = {}
) {
  const rejectedIds = new Set((request.rejectedProfessionals || []).map((row) => row.toString()));
  const respondedIds = new Set(
    (await MarketplaceApplication.find({ request: request._id }).distinct('professional')).map((id) => id.toString())
  );
  const strictMatches = await findMatchingProfessionals(request);
  const immediateCityMatches = await findImmediateCityProfessionals(request);
  const uniqueMap = new Map();

  strictMatches.forEach((row) => {
    uniqueMap.set(row._id.toString(), row);
  });
  immediateCityMatches.forEach((row) => {
    const key = row._id.toString();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { ...row, score: Number(row?.professionalProfile?.ratingAvg || 0) });
    }
  });

  const matches = Array.from(uniqueMap.values()).filter((row) => {
    const professionalId = row._id.toString();
    return !rejectedIds.has(professionalId) && !respondedIds.has(professionalId);
  });
  if (!matches.length) return { matched: 0, notified: 0 };

  const matchedUserIds = matches.map((row) => row._id);
  const existing = await Notification.find({
    user: { $in: matchedUserIds },
    type,
    'payload.requestId': request._id,
  })
    .select('user')
    .lean();

  const alreadyNotified = new Set(existing.map((row) => row.user?.toString()).filter(Boolean));
  const targets = matches.filter((row) => !alreadyNotified.has(row._id.toString()));

  await Promise.all(
    targets.map((pro, index) =>
      notifyUser(pro._id, type, title, message, {
        ...buildRequestNotificationPayload(request, {
          matchScore: Number(pro.score || 0),
          matchRank: index + 1,
        }),
      })
    )
  );

  return { matched: matches.length, notified: targets.length };
}

async function recomputeProfessionalRating(professionalId) {
  const ratings = await MarketplaceRating.find({
    toUser: professionalId,
    type: 'company_to_professional',
  }).select('score');

  const completedServicesCount = await MarketplaceAssignment.countDocuments({
    professional: professionalId,
    status: 'finished',
  });

  const avg =
    ratings.length > 0
      ? ratings.reduce((acc, r) => acc + Number(r.score || 0), 0) / ratings.length
      : 0;

  await User.findByIdAndUpdate(professionalId, {
    $set: {
      'professionalProfile.ratingAvg': Number(avg.toFixed(2)),
      'professionalProfile.completedServicesCount': completedServicesCount,
    },
  });
}

function computeProfileCompletion(user, certificationsCount = 0, documentsCount = 0) {
  const profile = user?.profile || {};
  const professionalProfile = user?.professionalProfile || {};

  const checks = [
    !!profile.avatarUrl,
    !!profile.firstName,
    !!profile.documentType,
    !!profile.documentNumber,
    !!profile.city,
    !!profile.phone,
    !!profile.bio,
    !!professionalProfile.mainProfession,
    !!professionalProfile.mainRole,
    Number(professionalProfile.yearsExperience || 0) > 0,
    !!professionalProfile.licenseNumber,
    !!professionalProfile.licenseIssuedAt,
    !!professionalProfile.licenseExpiryDate,
    (professionalProfile.areasExperience || []).length > 0,
    (professionalProfile.servicesOffered || []).length > 0,
    (professionalProfile.serviceMunicipalities || []).length > 0,
    (professionalProfile.serviceDepartments || []).length > 0,
    (professionalProfile.workExperiences || []).length > 0,
    (professionalProfile.educationItems || []).length > 0,
    certificationsCount > 0,
    documentsCount > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const percentage = Math.round((completed / checks.length) * 100);

  const recommendations = [];
  if (!professionalProfile.licenseNumber) recommendations.push('Sube tu licencia SST.');
  if (certificationsCount === 0) recommendations.push('Agrega una certificación.');
  if ((professionalProfile.workExperiences || []).length === 0) {
    recommendations.push('Completa tu experiencia laboral.');
  }
  if ((professionalProfile.educationItems || []).length === 0) {
    recommendations.push('Completa tu formación académica.');
  }
  if (documentsCount === 0) recommendations.push('Sube tus documentos profesionales.');

  return { percentage, recommendations };
}

router.get('/professionals/public', async (req, res, next) => {
  try {
    const cityCode = String(req.query.cityCode || '').trim();
    const cityText = String(req.query.city || '').trim();
    const selectedCity = cityCode ? resolveCitySelection({ cityCode }) : resolveCitySelection(cityText);
    const normalizedCityText = normalizeLocationText(cityText);
    const specialty = normalize(req.query.specialty);
    const type = normalize(req.query.type);
    const requiresSstLicense = req.query.requiresSstLicense === 'true';
    const requiresWorkingAtHeights = req.query.requiresWorkingAtHeights === 'true';
    const requiresConfinedSpaces = req.query.requiresConfinedSpaces === 'true';
    const minYearsExperience = Number(req.query.minYearsExperience || 0);
    const minRating = Number(req.query.minRating || 0);
    const minCompletedServices = Number(req.query.minCompletedServices || 0);

    const professionals = await User.find({
      role: 'professional_sst',
      isActive: true,
      'professionalProfile.availabilityStatus': 'available',
    })
      .select('profile professionalProfile')
      .lean();

    const filtered = professionals.filter((p) => {
      const prof = p.professionalProfile || {};
      if (cityCode || cityText) {
        if (!hasCityCoverage(prof, selectedCity, normalizedCityText)) return false;
      }

      if (type) {
        const profession = normalize(prof.mainProfession);
        const mainRole = normalize(prof.mainRole);
        const services = (prof.servicesOffered || []).map(normalize);
        const isSstRequired = isSstText(type);
        const sstMatch =
          isSstText(profession) || isSstText(mainRole) || services.some((s) => isSstText(s));
        const typeMatch =
          profession.includes(type) ||
          mainRole.includes(type) ||
          services.some((s) => s.includes(type) || type.includes(s)) ||
          (isSstRequired && sstMatch);
        if (!typeMatch) return false;
      }

      if (specialty) {
        const specialties = [prof.specialty, ...(prof.specialties || []), ...(prof.servicesOffered || [])]
          .map(normalize)
          .filter(Boolean);
        if (!specialties.some((s) => s.includes(specialty) || specialty.includes(s))) return false;
      }

      if (requiresSstLicense) {
        const hasMain =
          prof.licenseNumber &&
          prof.licenseExpiryDate &&
          new Date(prof.licenseExpiryDate).getTime() >= Date.now();
        const hasList = (prof.licenses || []).some(
          (license) =>
            license?.number &&
            license?.expiryDate &&
            new Date(license.expiryDate).getTime() >= Date.now()
        );
        if (!hasMain && !hasList) return false;
      }

      if (requiresWorkingAtHeights || requiresConfinedSpaces) {
        // En busqueda manual se valida contra tipos declarados en perfil hasta que haya join de certificaciones.
        const declared = [prof.specialty, ...(prof.specialties || []), ...(prof.servicesOffered || [])]
          .map(normalize)
          .join(' ');
        if (requiresWorkingAtHeights && !declared.includes('alturas')) return false;
        if (requiresConfinedSpaces && !declared.includes('confinad')) return false;
      }

      if (minYearsExperience > 0 && Number(prof.yearsExperience || 0) < minYearsExperience) return false;
      if (minRating > 0 && Number(prof.ratingAvg || 0) < minRating) return false;
      if (minCompletedServices > 0 && Number(prof.completedServicesCount || 0) < minCompletedServices) return false;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const ra = Number(a.professionalProfile?.ratingAvg || 0);
      const rb = Number(b.professionalProfile?.ratingAvg || 0);
      if (rb !== ra) return rb - ra;
      return Number(b.professionalProfile?.completedServicesCount || 0) -
        Number(a.professionalProfile?.completedServicesCount || 0);
    });

    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

router.get('/professionals/me', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }
    const [certifications, documents, freshUser] = await Promise.all([
      ProfessionalCertification.find({ professional: req.user._id }).sort({ createdAt: -1 }),
      ProfessionalDocument.find({ professional: req.user._id }).sort({ createdAt: -1 }),
      User.findById(req.user._id),
    ]);
    const completion = computeProfileCompletion(
      freshUser?.toObject() || req.user,
      certifications.length,
      documents.length
    );
    res.json({ user: freshUser?.toSafeJSON() || req.user.toSafeJSON(), certifications, documents, completion });
  } catch (err) {
    next(err);
  }
});

router.get('/professionals/:id/public', async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'professional_sst', isActive: true }).lean();
    if (!user) return res.status(404).json({ message: 'Profesional no encontrado' });

    const [certifications, documents, ratings] = await Promise.all([
      ProfessionalCertification.find({ professional: user._id })
        .select('type title fileUrl issuedAt expiresAt isVerified')
        .sort({ createdAt: -1 })
        .lean(),
      ProfessionalDocument.find({ professional: user._id })
        .select('name type fileUrl expiresAt status createdAt')
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

router.patch(
  '/professionals/me',
  [
    body('professionalProfile').isObject(),
    body('professionalProfile.yearsExperience').optional().isInt({ min: 0 }),
    body('professionalProfile.geographicAvailability')
      .optional()
      .isIn(['city_only', 'city_nearby', 'department', 'multi_department', 'nationwide']),
    body('professionalProfile.availabilityStatus')
      .optional()
      .isIn(['available', 'busy', 'unavailable']),
  ],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST' });
      }
      if (!validate(req, res)) return;

      const allowed = [
        'mainProfession',
        'mainRole',
        'specialty',
        'yearsExperience',
        'experienceSummary',
        'licenseNumber',
        'licenseIssuedAt',
        'licenseExpiryDate',
        'licenseStatus',
        'licenses',
        'workExperiences',
        'studies',
        'educationItems',
        'areasExperience',
        'servicesOffered',
        'specialties',
        'geographicAvailability',
        'canTravel',
        'immediateAvailability',
        'availabilityStatus',
      ];

      const patch = {};
      for (const key of allowed) {
        if (req.body.professionalProfile?.[key] !== undefined) {
          patch[`professionalProfile.${key}`] = req.body.professionalProfile[key];
        }
      }

      const geographicAvailability = req.body.professionalProfile?.geographicAvailability;
      if (geographicAvailability === 'nationwide') {
        patch['professionalProfile.canTravel'] = true;
      }
      if (req.body.profile?.avatarUrl !== undefined) {
        patch['profile.avatarUrl'] = req.body.profile.avatarUrl;
      }
      const profileAllowed = [
        'firstName',
        'lastName',
        'documentType',
        'documentNumber',
        'birthDate',
        'gender',
        'city',
        'department',
        'address',
        'phone',
        'whatsapp',
        'bio',
        'avatarUrl',
      ];
      for (const key of profileAllowed) {
        if (req.body.profile?.[key] !== undefined) {
          patch[`profile.${key}`] = req.body.profile[key];
        }
      }

      const citySelection =
        resolveCitySelection(req.body.professionalProfile?.cityLocation) ||
        resolveCitySelection(req.body.profile?.cityLocation) ||
        resolveCitySelection(req.body.professionalProfile?.city) ||
        resolveCitySelection(req.body.profile?.city);

      if (
        req.body.professionalProfile?.cityLocation !== undefined ||
        req.body.profile?.cityLocation !== undefined ||
        req.body.professionalProfile?.city !== undefined ||
        req.body.profile?.city !== undefined
      ) {
        if (!citySelection) {
          return res.status(400).json({ message: 'Selecciona una ciudad valida desde la lista' });
        }
        patch['professionalProfile.city'] = citySelection.cityName;
        patch['professionalProfile.department'] = citySelection.departmentName;
        patch['professionalProfile.cityCode'] = citySelection.cityCode;
        patch['professionalProfile.departmentCode'] = citySelection.departmentCode;
        patch['profile.city'] = citySelection.cityName;
        patch['profile.department'] = citySelection.departmentName;
        patch['profile.cityCode'] = citySelection.cityCode;
        patch['profile.departmentCode'] = citySelection.departmentCode;
        patch['profile.countryCode'] = citySelection.countryCode;
      }

      if (
        req.body.professionalProfile?.serviceMunicipalityLocations !== undefined ||
        req.body.professionalProfile?.serviceMunicipalities !== undefined
      ) {
        const municipalities = resolveCitySelections(
          req.body.professionalProfile?.serviceMunicipalityLocations ||
            req.body.professionalProfile?.serviceMunicipalities ||
            []
        );
        patch['professionalProfile.serviceMunicipalities'] = municipalities.map((item) => item.cityName);
        patch['professionalProfile.serviceMunicipalityCodes'] = municipalities.map((item) => item.cityCode);
      }

      if (
        req.body.professionalProfile?.serviceDepartmentLocations !== undefined ||
        req.body.professionalProfile?.serviceDepartments !== undefined
      ) {
        const departments = resolveDepartmentSelections(
          req.body.professionalProfile?.serviceDepartmentLocations ||
            req.body.professionalProfile?.serviceDepartments ||
            []
        );
        patch['professionalProfile.serviceDepartments'] = departments.map((item) => item.departmentName);
        patch['professionalProfile.serviceDepartmentCodes'] = departments.map((item) => item.departmentCode);
      }

      const user = await User.findByIdAndUpdate(req.user._id, { $set: patch }, { new: true }).populate(
        'company'
      );

      await logAudit({
        user: req.user,
        action: 'update_professional_profile',
        entity: 'User',
        entityId: req.user._id,
        changes: patch,
        req,
      });

      res.json({ user: user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/professionals/me/certifications',
  [
    body('type').isIn(PROFESSIONAL_CERTIFICATION_TYPES),
    body('title').trim().notEmpty(),
    body('fileUrl').trim().notEmpty(),
    body('issuedAt').optional().isISO8601(),
    body('expiresAt').optional().isISO8601(),
  ],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST' });
      }
      if (!validate(req, res)) return;

      const certification = await ProfessionalCertification.create({
        professional: req.user._id,
        type: req.body.type,
        title: req.body.title,
        fileUrl: req.body.fileUrl,
        issuedAt: req.body.issuedAt,
        expiresAt: req.body.expiresAt,
      });

      await logAudit({
        user: req.user,
        action: 'create_certification',
        entity: 'ProfessionalCertification',
        entityId: certification._id,
        req,
      });

      res.status(201).json(certification);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/professionals/me/certifications/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('fileUrl').optional().trim().notEmpty(),
    body('issuedAt').optional().isISO8601(),
    body('expiresAt').optional().isISO8601(),
    body('type').optional().isIn(PROFESSIONAL_CERTIFICATION_TYPES),
  ],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST' });
      }
      if (!validate(req, res)) return;

      const patch = {};
      if (req.body.title !== undefined) patch.title = req.body.title;
      if (req.body.fileUrl !== undefined) patch.fileUrl = req.body.fileUrl;
      if (req.body.issuedAt !== undefined) patch.issuedAt = req.body.issuedAt;
      if (req.body.expiresAt !== undefined) patch.expiresAt = req.body.expiresAt;
      if (req.body.type !== undefined) patch.type = req.body.type;

      const certification = await ProfessionalCertification.findOneAndUpdate(
        { _id: req.params.id, professional: req.user._id },
        patch,
        { new: true }
      );
      if (!certification) return res.status(404).json({ message: 'Certificación no encontrada' });

      await logAudit({
        user: req.user,
        action: 'update_certification',
        entity: 'ProfessionalCertification',
        entityId: certification._id,
        changes: patch,
        req,
      });

      res.json(certification);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/professionals/me/documents', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }
    const documents = await ProfessionalDocument.find({ professional: req.user._id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/professionals/me/documents',
  [
    body('name').trim().notEmpty(),
    body('type').isIn(PROFESSIONAL_DOCUMENT_TYPES),
    body('fileUrl').trim().notEmpty(),
    body('expiresAt').optional().isISO8601(),
  ],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST' });
      }
      if (!validate(req, res)) return;

      const document = await ProfessionalDocument.create({
        professional: req.user._id,
        name: req.body.name,
        type: req.body.type,
        fileUrl: req.body.fileUrl,
        expiresAt: req.body.expiresAt,
        status: req.body.status || 'active',
      });

      await logAudit({
        user: req.user,
        action: 'create_professional_document',
        entity: 'ProfessionalDocument',
        entityId: document._id,
        req,
      });

      res.status(201).json(document);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/professionals/me/documents/:id',
  [body('name').optional().trim(), body('fileUrl').optional().trim(), body('expiresAt').optional().isISO8601()],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST' });
      }
      if (!validate(req, res)) return;

      const patch = {};
      if (req.body.name !== undefined) patch.name = req.body.name;
      if (req.body.type !== undefined) patch.type = req.body.type;
      if (req.body.fileUrl !== undefined) patch.fileUrl = req.body.fileUrl;
      if (req.body.expiresAt !== undefined) patch.expiresAt = req.body.expiresAt;
      if (req.body.status !== undefined) patch.status = req.body.status;

      const document = await ProfessionalDocument.findOneAndUpdate(
        { _id: req.params.id, professional: req.user._id },
        patch,
        { new: true }
      );
      if (!document) return res.status(404).json({ message: 'Documento no encontrado' });

      await logAudit({
        user: req.user,
        action: 'update_professional_document',
        entity: 'ProfessionalDocument',
        entityId: document._id,
        changes: patch,
        req,
      });

      res.json(document);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/professionals/me/documents/:id', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }
    const document = await ProfessionalDocument.findOneAndDelete({
      _id: req.params.id,
      professional: req.user._id,
    });
    if (!document) return res.status(404).json({ message: 'Documento no encontrado' });

    await logAudit({
      user: req.user,
      action: 'delete_professional_document',
      entity: 'ProfessionalDocument',
      entityId: document._id,
      req,
    });

    res.json({ message: 'Documento eliminado' });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/requests',
  [
    body('contactName').trim().notEmpty(),
    body('contactPhone').trim().notEmpty(),
    body('contactEmail').isEmail(),
    body('cityLocation').isObject(),
    body('startDate').isISO8601(),
    body('requiredProfessionalType').trim().notEmpty(),
    body('workersCount').isInt({ min: 1 }),
    body('description').trim().notEmpty(),
    body('requiredAvailability').optional().isIn(MARKETPLACE_REQUIRED_AVAILABILITY),
    body('budgetReference').optional().isFloat({ min: 0 }),
    body('minimumRating').optional().isFloat({ min: 0, max: 5 }),
    body('minimumCompletedServices').optional().isInt({ min: 0 }),
    body('requiresSstLicense').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      if (!isCompanyClient(req.user) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo empresas registradas pueden crear solicitudes' });
      }
      if (!validate(req, res)) return;

      const cityLocation = resolveCitySelection(req.body.cityLocation);
      if (!cityLocation) {
        return res.status(400).json({ message: 'Selecciona una ciudad valida desde el autocompletado' });
      }

      const company = req.user.company || req.body.company;
      if (!company) {
        return res.status(400).json({ message: 'Debes tener una empresa asociada' });
      }

      const request = await MarketplaceRequest.create({
        company,
        createdBy: req.user._id,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        contactEmail: req.body.contactEmail,
        city: cityLocation.cityName,
        department: cityLocation.departmentName,
        cityCode: cityLocation.cityCode,
        departmentCode: cityLocation.departmentCode,
        countryCode: cityLocation.countryCode,
        address: req.body.address,
        startDate: req.body.startDate,
        estimatedEndDate: req.body.estimatedEndDate,
        requiredProfessionalType: req.body.requiredProfessionalType,
        requiredService: req.body.requiredService,
        minYearsExperience: Number(req.body.minYearsExperience || 0),
        minimumRating: Number(req.body.minimumRating || 0),
        minimumCompletedServices: Number(req.body.minimumCompletedServices || 0),
        availableFromDate: req.body.availableFromDate,
        workersCount: req.body.workersCount,
        riskLevel: req.body.riskLevel,
        schedule: req.body.schedule,
        requiresSstLicense: !!req.body.requiresSstLicense,
        requiresWorkingAtHeights: !!req.body.requiresWorkingAtHeights,
        requiresConfinedSpaces: !!req.body.requiresConfinedSpaces,
        requiresImmediateAvailability: !!req.body.requiresImmediateAvailability,
        requiredAvailability: req.body.requiredAvailability || (req.body.requiresImmediateAvailability ? 'immediate' : 'this_week'),
        budgetReference: req.body.budgetReference,
        requiredSpecialties: req.body.requiredSpecialties || [],
        description: req.body.description,
        attachments: req.body.attachments || [],
        status: req.body.publishNow ? 'published' : 'draft',
      });

      if (request.status === 'published') {
        await notifyCompatibleProfessionals(request, {
          type: 'marketplace_match',
          title: 'Nueva solicitud compatible',
          message: buildProfessionalMatchMessage(request),
        });
      }

      await logAudit({
        user: req.user,
        action: 'create_marketplace_request',
        entity: 'MarketplaceRequest',
        entityId: request._id,
        req,
      });

      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/requests', async (req, res, next) => {
  try {
    const filter = {};

    if (isProfessional(req.user)) {
      filter.status = { $in: ['published', 'in_postulation', 'professional_selected', 'in_execution'] };
    } else if (req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role)) {
      if (req.query.status) filter.status = req.query.status;
    } else {
      filter.createdBy = req.user._id;
      if (req.query.status) filter.status = req.query.status;
    }

    const requests = await MarketplaceRequest.find(filter)
      .populate('company')
      .populate('createdBy', 'email profile')
      .populate('selectedProfessional', 'email profile professionalProfile')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/opportunities', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }

    const respondedRequestIds = await MarketplaceApplication.find({
      professional: req.user._id,
    }).distinct('request');

    const openRequests = await MarketplaceRequest.find({
      status: { $in: ['published', 'in_postulation'] },
      rejectedProfessionals: { $ne: req.user._id },
      _id: { $nin: respondedRequestIds },
    })
      .populate('company')
      .populate('createdBy', 'email profile')
      .sort({ createdAt: -1 });

    const opportunities = [];
    for (const request of openRequests) {
      const matches = await findMatchingProfessionals(request);
      if (matches.some((p) => p._id.toString() === req.user._id.toString())) {
        opportunities.push(request);
      }
    }

    res.json(opportunities);
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/reject', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST pueden rechazar oportunidades' });
    }

    const request = await MarketplaceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
    if (!['published', 'in_postulation'].includes(request.status)) {
      return res.status(400).json({ message: 'La solicitud ya no esta disponible' });
    }

    const existingApplication = await MarketplaceApplication.findOne({
      request: request._id,
      professional: req.user._id,
    }).select('_id');

    if (existingApplication) {
      return res.status(409).json({ message: 'Ya respondiste a esta solicitud' });
    }

    if (!request.rejectedProfessionals.some((row) => row.toString() === req.user._id.toString())) {
      request.rejectedProfessionals.push(req.user._id);
      await request.save();
    }

    await Notification.deleteMany({
      user: req.user._id,
      type: { $in: ['marketplace_match', 'marketplace_reopened'] },
      $or: [
        { 'payload.requestId': request._id },
        { 'payload.requestId': request._id.toString() },
      ],
    });

    res.json({ message: 'Oportunidad descartada' });
  } catch (err) {
    next(err);
  }
});

router.get('/requests/:id', async (req, res, next) => {
  try {
    const request = await MarketplaceRequest.findById(req.params.id)
      .populate('company')
      .populate('createdBy', 'email profile')
      .populate('selectedProfessional', 'email profile professionalProfile');

    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const isOwner = request.createdBy?._id?.toString() === req.user._id.toString();
    const canView =
      isOwner ||
      isProfessional(req.user) ||
      req.user.role === 'admin' ||
      ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);

    if (!canView) return res.status(403).json({ message: 'Sin permisos' });

    res.json(request);
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/republish', async (req, res, next) => {
  try {
    const source = await MarketplaceRequest.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const isOwner = source.createdBy.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
    if (!isOwner && !isOperator) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const republished = await MarketplaceRequest.create({
      company: source.company,
      createdBy: source.createdBy,
      contactName: source.contactName,
      contactPhone: source.contactPhone,
      contactEmail: source.contactEmail,
      city: source.city,
      department: source.department,
      cityCode: source.cityCode,
      departmentCode: source.departmentCode,
      countryCode: source.countryCode || 'CO',
      address: source.address,
      startDate: source.startDate,
      estimatedEndDate: source.estimatedEndDate,
      requiredProfessionalType: source.requiredProfessionalType,
      requiredService: source.requiredService,
      minYearsExperience: source.minYearsExperience,
      minimumRating: source.minimumRating,
      minimumCompletedServices: source.minimumCompletedServices,
      availableFromDate: source.availableFromDate,
      workersCount: source.workersCount,
      riskLevel: source.riskLevel,
      schedule: source.schedule,
      requiresSstLicense: source.requiresSstLicense,
      requiresWorkingAtHeights: source.requiresWorkingAtHeights,
      requiresConfinedSpaces: source.requiresConfinedSpaces,
      requiresImmediateAvailability: source.requiresImmediateAvailability,
      requiredAvailability: source.requiredAvailability,
      budgetReference: source.budgetReference,
      requiredSpecialties: source.requiredSpecialties || [],
      description: source.description,
      attachments: source.attachments || [],
      status: 'published',
    });

    await notifyCompatibleProfessionals(republished, {
      type: 'marketplace_match',
      title: 'Nueva solicitud compatible',
      message: buildProfessionalMatchMessage(republished),
    });

    await logAudit({
      user: req.user,
      action: 'republish_marketplace_request',
      entity: 'MarketplaceRequest',
      entityId: republished._id,
      changes: { sourceRequestId: source._id },
      req,
    });

    res.status(201).json(republished);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/requests/:id/status',
  [body('status').isIn(MARKETPLACE_REQUEST_STATUSES)],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const request = await MarketplaceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

      const isOwner = request.createdBy.toString() === req.user._id.toString();
      const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
      if (!isOwner && !isOperator) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      request.status = req.body.status;
      await request.save();

      if (req.body.status === 'published' || req.body.status === 'in_postulation') {
        await notifyCompatibleProfessionals(request, {
          type: 'marketplace_match',
          title: 'Solicitud abierta para postulación',
          message: buildProfessionalMatchMessage(request),
        });
      }

      await logAudit({
        user: req.user,
        action: 'update_marketplace_request_status',
        entity: 'MarketplaceRequest',
        entityId: request._id,
        changes: { status: req.body.status },
        req,
      });

      res.json(request);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/requests/:id/matches', async (req, res, next) => {
  try {
    const request = await MarketplaceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const isOwner = request.createdBy.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
    if (!isOwner && !isOperator) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const matches = await findMatchingProfessionals(request);

    await notifyCompatibleProfessionals(request, {
      type: 'marketplace_match',
      title: 'Tu perfil coincide con una solicitud',
      message: buildProfessionalMatchMessage(request),
    });

    res.json(matches);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/requests/:id/applications',
  [body('economicProposal').isFloat({ min: 0 }), body('availabilityNote').optional().trim()],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST pueden postularse' });
      }
      if (!validate(req, res)) return;

      const request = await MarketplaceRequest.findById(req.params.id).populate('createdBy', 'email profile');
      if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
      if (!['published', 'in_postulation'].includes(request.status)) {
        return res.status(400).json({ message: 'La solicitud no está recibiendo postulaciones' });
      }

      const application = await MarketplaceApplication.create({
        request: request._id,
        professional: req.user._id,
        availabilityNote: req.body.availabilityNote,
        economicProposal: req.body.economicProposal,
        observations: req.body.observations,
      });

      if (request.status === 'published') {
        request.status = 'in_postulation';
      }

      request.rejectedProfessionals = (request.rejectedProfessionals || []).filter(
        (row) => row.toString() !== req.user._id.toString()
      );
      await request.save();

      const professionalName = `${req.user.profile?.firstName || ''} ${req.user.profile?.lastName || ''}`.trim() || 'Profesional SST';

      await notifyUser(
        request.createdBy._id,
        'new_application',
        'Nueva postulación recibida',
        `${professionalName} se postuló a tu solicitud.`,
        buildRequestNotificationPayload(request, {
          applicationId: application._id,
          professionalId: req.user._id,
        })
      );

      await logAudit({
        user: req.user,
        action: 'create_marketplace_application',
        entity: 'MarketplaceApplication',
        entityId: application._id,
        req,
      });

      res.status(201).json(application);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Ya te postulaste a esta solicitud' });
      }
      next(err);
    }
  }
);

router.get('/applications/mine', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }
    const applications = await MarketplaceApplication.find({ professional: req.user._id })
      .populate('request')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

router.get('/requests/:id/applications', async (req, res, next) => {
  try {
    const request = await MarketplaceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const isOwner = request.createdBy.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);

    let filter = { request: request._id };
    if (!isOwner && !isOperator) {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Sin permisos' });
      }
      filter.professional = req.user._id;
    }

    const applications = await MarketplaceApplication.find(filter)
      .populate('professional', 'email profile professionalProfile')
      .sort({ createdAt: -1 });

    if (!isOwner && !isOperator) {
      return res.json(applications);
    }

    const professionalIds = applications.map((a) => a.professional?._id).filter(Boolean);
    const certifications = await ProfessionalCertification.find({
      professional: { $in: professionalIds },
    })
      .select('professional title type isVerified expiresAt')
      .lean();

    const certMap = certifications.reduce((acc, cert) => {
      const key = cert.professional.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(cert);
      return acc;
    }, {});

    const enriched = applications.map((a) => {
      const row = a.toObject();
      const professionalId = row.professional?._id?.toString();
      row.professionalCertifications = professionalId ? certMap[professionalId] || [] : [];
      row.professionalRatingAvg = row.professional?.professionalProfile?.ratingAvg || 0;
      row.professionalCompletedServices = row.professional?.professionalProfile?.completedServicesCount || 0;
      return row;
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.get('/company/chat-inbox', async (req, res, next) => {
  try {
    if (!isCompanyClient(req.user) && !isOperator(req.user)) {
      return res.status(403).json({ message: 'Solo empresa puede ver la bandeja de chat' });
    }

    const rows = await MarketplaceConversationMessage.find({ companyUser: req.user._id })
      .populate('professional', 'email profile professionalProfile')
      .populate('request', 'requiredProfessionalType city status')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const map = new Map();
    for (const row of rows) {
      const professionalId = row.professional?._id?.toString();
      const requestId = row.request?._id?.toString();
      if (!professionalId || !requestId) continue;

      const key = `${requestId}:${professionalId}`;
      if (map.has(key)) continue;

      const profile = row.professional?.profile || {};
      const professionalProfile = row.professional?.professionalProfile || {};
      map.set(key, {
        requestId,
        professionalId,
        professionalName: displayNameFromUser(row.professional),
        professionalEmail: row.professional?.email || '',
        professionalType: professionalProfile.mainProfession || professionalProfile.mainRole || 'Profesional SST',
        professionalCity: profile.city || professionalProfile.city || '',
        requestTitle: row.request?.requiredProfessionalType || 'Solicitud SST',
        requestCity: row.request?.city || '',
        requestStatus: row.request?.status || '',
        lastMessage: row.message,
        lastMessageAt: row.createdAt,
      });
    }

    res.json(Array.from(map.values()));
  } catch (err) {
    next(err);
  }
});

router.get('/request-professional/:requestId/:professionalId', async (req, res, next) => {
  try {
    const { requestId, professionalId } = req.params;
    const workspace = await resolveWorkspace(req, requestId, professionalId);
    if (workspace.error) {
      return res.status(workspace.error.status).json({ message: workspace.error.message });
    }

    const { request, professional, application, assignment } = workspace;
    res.json({
      request: {
        _id: request._id,
        city: request.city,
        department: request.department,
        requiredProfessionalType: request.requiredProfessionalType,
        description: request.description,
        status: request.status,
        startDate: request.startDate,
      },
      company: {
        legalName: request.company?.legalName || '',
        contactName: request.contactName,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
      },
      professional,
      application,
      assignment,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/request-professional/:requestId/:professionalId/contract-file', (req, res, next) => {
  contractUpload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'No se pudo cargar el archivo' });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    const { requestId, professionalId } = req.params;
    const workspace = await resolveWorkspace(req, requestId, professionalId);
    if (workspace.error) {
      return res.status(workspace.error.status).json({ message: workspace.error.message });
    }

    if (!workspace.ownerCompany && !isOperator(req.user)) {
      return res.status(403).json({ message: 'Solo la empresa puede subir el contrato' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Debes seleccionar un archivo PDF' });
    }

    const contractFileUrl = `/uploads/contracts/${req.file.filename}`;
    const application = await MarketplaceApplication.findOneAndUpdate(
      { request: workspace.request._id, professional: professionalId },
      { $set: { contractFileUrl } },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'La postulación no fue encontrada para este profesional' });
    }

    await notifyUser(
      professionalId,
      'contract_uploaded',
      'Contrato cargado por la empresa',
      'La empresa cargó un contrato PDF en tu espacio de solicitud.',
      { requestId: workspace.request._id, professionalId }
    );

    await logAudit({
      user: req.user,
      action: 'upload_marketplace_contract_pdf',
      entity: 'MarketplaceApplication',
      entityId: application._id,
      changes: { contractFileUrl },
      req,
    });

    return res.json({ contractFileUrl, application });
  } catch (err) {
    next(err);
  }
});

router.get('/request-professional/:requestId/:professionalId/messages', async (req, res, next) => {
  try {
    const { requestId, professionalId } = req.params;
    const workspace = await resolveWorkspace(req, requestId, professionalId);
    if (workspace.error) {
      return res.status(workspace.error.status).json({ message: workspace.error.message });
    }

    const rows = await MarketplaceConversationMessage.find({
      request: workspace.request._id,
      professional: professionalId,
    })
      .populate('sender', 'email profile role')
      .sort({ createdAt: 1 })
      .limit(200);

    const messages = rows.map((row) => ({
      _id: row._id,
      message: row.message,
      createdAt: row.createdAt,
      senderId: row.sender?._id,
      senderRole: row.sender?.role,
      senderName: displayNameFromUser(row.sender),
      mine: row.sender?._id?.toString() === req.user._id.toString(),
    }));

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/request-professional/:requestId/:professionalId/messages',
  [body('message').trim().isLength({ min: 1, max: 2000 })],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const { requestId, professionalId } = req.params;
      const workspace = await resolveWorkspace(req, requestId, professionalId);
      if (workspace.error) {
        return res.status(workspace.error.status).json({ message: workspace.error.message });
      }

      const row = await MarketplaceConversationMessage.create({
        request: workspace.request._id,
        professional: professionalId,
        companyUser: workspace.request.createdBy?._id || workspace.request.createdBy,
        sender: req.user._id,
        message: req.body.message,
      });

      const targetUserId = req.user._id.toString() === professionalId
        ? (workspace.request.createdBy?._id || workspace.request.createdBy)
        : professionalId;

      await notifyUser(
        targetUserId,
        'marketplace_chat_message',
        'Nuevo mensaje en solicitud',
        `${displayNameFromUser(req.user)} envió un mensaje en el espacio de coordinación.`,
        { requestId: workspace.request._id, professionalId }
      );

      res.status(201).json({
        _id: row._id,
        message: row.message,
        createdAt: row.createdAt,
        senderId: req.user._id,
        senderRole: req.user.role,
        senderName: displayNameFromUser(req.user),
        mine: true,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/requests/:id/select',
  [body('professionalId').notEmpty(), body('agreedValue').isFloat({ min: 0 })],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const request = await MarketplaceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });

      const isOwner = request.createdBy.toString() === req.user._id.toString();
      const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
      if (!isOwner && !isOperator) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      const application = await MarketplaceApplication.findOne({
        request: request._id,
        professional: req.body.professionalId,
      });
      if (!application) {
        return res.status(404).json({ message: 'Postulación no encontrada para el profesional seleccionado' });
      }

      let assignment = await MarketplaceAssignment.findOne({ request: request._id });
      if (assignment && assignment.status !== 'cancelled') {
        return res.status(409).json({ message: 'La solicitud ya tiene una asignación activa' });
      }

      const serviceOrderCode = `BEMC-OS-${request._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      if (!assignment) {
        assignment = await MarketplaceAssignment.create({
          request: request._id,
          professional: req.body.professionalId,
          company: request.company,
          assignedBy: req.user._id,
          assignedAt: new Date(),
          agreedValue: req.body.agreedValue,
          status: 'assigned',
          professionalDecision: 'pending',
          professionalDecisionAt: null,
          professionalDecisionReason: '',
          serviceOrderCode,
          contractStatus: 'pending_send',
        });
        assignment.contractDraftUrl = `/api/marketplace/assignments/${assignment._id}/contract-draft`;
        await assignment.save();
      } else {
        assignment.professional = req.body.professionalId;
        assignment.company = request.company;
        assignment.assignedBy = req.user._id;
        assignment.assignedAt = new Date();
        assignment.agreedValue = req.body.agreedValue;
        assignment.status = 'assigned';
        assignment.professionalDecision = 'pending';
        assignment.professionalDecisionAt = null;
        assignment.professionalDecisionReason = '';
        assignment.serviceOrderCode = serviceOrderCode;
        assignment.contractStatus = 'pending_send';
        assignment.contractDraftUrl = `/api/marketplace/assignments/${assignment._id}/contract-draft`;
        assignment.finishedAt = undefined;
        assignment.finalCertificateUrl = undefined;
        assignment.finalReportUrl = undefined;
        await assignment.save();
      }

      request.status = 'professional_selected';
      request.selectedProfessional = req.body.professionalId;
      request.selectedAt = new Date();
      await request.save();

      await MarketplaceApplication.updateMany(
        { request: request._id, _id: { $ne: application._id } },
        { $set: { status: 'closed' } }
      );
      application.status = 'selected';
      await application.save();

      await notifyUser(
        req.body.professionalId,
        'selected_professional',
        'Has sido seleccionado',
        'Fuiste seleccionado para una solicitud marketplace SST.',
        { requestId: request._id, assignmentId: assignment._id }
      );

      const others = await MarketplaceApplication.find({ request: request._id, _id: { $ne: application._id } })
        .select('professional');
      for (const row of others) {
        await notifyUser(
          row.professional,
          'vacancy_closed',
          'Vacante cerrada',
          'La empresa ya seleccionó un profesional para esta solicitud.',
          { requestId: request._id }
        );
      }

      await logAudit({
        user: req.user,
        action: 'select_marketplace_professional',
        entity: 'MarketplaceAssignment',
        entityId: assignment._id,
        changes: { request: request._id, professional: req.body.professionalId },
        req,
      });

      res.status(201).json(assignment);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/assignments', async (req, res, next) => {
  try {
    const filter = {};
    if (isProfessional(req.user)) {
      filter.professional = req.user._id;
    } else if (req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role)) {
      if (req.query.status) filter.status = req.query.status;
    } else {
      const ownRequests = await MarketplaceRequest.find({ createdBy: req.user._id }).select('_id');
      filter.request = { $in: ownRequests.map((r) => r._id) };
    }

    if (req.query.status) filter.status = req.query.status;

    const assignments = await MarketplaceAssignment.find(filter)
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const filter = { status: 'finished' };
    if (isProfessional(req.user)) {
      filter.professional = req.user._id;
    } else if (req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role)) {
      // staff/admin can see all finished assignments
    } else {
      const ownRequests = await MarketplaceRequest.find({ createdBy: req.user._id }).select('_id');
      filter.request = { $in: ownRequests.map((r) => r._id) };
    }

    const history = await MarketplaceAssignment.find(filter)
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company')
      .sort({ finishedAt: -1, createdAt: -1 });

    res.json(history);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/assignments/:id/decision',
  [body('decision').isIn(['accepted', 'rejected']), body('reason').optional().trim()],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST pueden decidir la asignación' });
      }

      const assignment = await MarketplaceAssignment.findById(req.params.id).populate('request');
      if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

      if (assignment.professional.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      if (assignment.status !== 'assigned') {
        return res.status(400).json({ message: 'Solo puedes decidir asignaciones pendientes' });
      }

      assignment.professionalDecision = req.body.decision;
      assignment.professionalDecisionAt = new Date();
      assignment.professionalDecisionReason = req.body.reason || '';

      if (req.body.decision === 'accepted') {
        await assignment.save();

        await notifyUser(
          assignment.request.createdBy,
          'assignment_accepted',
          'Profesional confirmó asignación',
          'El profesional aceptó la asignación y puede iniciar el servicio.',
          {
            requestId: assignment.request._id,
            assignmentId: assignment._id,
            professionalId: assignment.professional,
          }
        );

        await logAudit({
          user: req.user,
          action: 'accept_marketplace_assignment',
          entity: 'MarketplaceAssignment',
          entityId: assignment._id,
          changes: { professionalDecision: 'accepted' },
          req,
        });

        return res.json(assignment);
      }

      assignment.status = 'cancelled';
      await assignment.save();

      await MarketplaceRequest.findByIdAndUpdate(assignment.request._id, {
        status: 'in_postulation',
        $unset: { selectedProfessional: 1, selectedAt: 1 },
      });

      await MarketplaceApplication.updateOne(
        { request: assignment.request._id, professional: req.user._id },
        { $set: { status: 'rejected' } }
      );

      await MarketplaceApplication.updateMany(
        { request: assignment.request._id, professional: { $ne: req.user._id }, status: 'closed' },
        { $set: { status: 'active' } }
      );

      await notifyCompatibleProfessionals(assignment.request, {
        type: 'marketplace_reopened',
        title: 'Solicitud reabierta',
        message: buildProfessionalMatchMessage(assignment.request),
      });

      await notifyUser(
        assignment.request.createdBy,
        'assignment_rejected',
        'Profesional rechazó asignación',
        'El profesional rechazó la asignación. La solicitud fue reabierta.',
        { requestId: assignment.request._id, assignmentId: assignment._id }
      );

      await logAudit({
        user: req.user,
        action: 'reject_marketplace_assignment',
        entity: 'MarketplaceAssignment',
        entityId: assignment._id,
        changes: { professionalDecision: 'rejected', status: 'cancelled' },
        req,
      });

      res.json(assignment);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/assignments/:id/status',
  [body('status').isIn(MARKETPLACE_ASSIGNMENT_STATUSES)],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const assignment = await MarketplaceAssignment.findById(req.params.id).populate('request');
      if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

      const isOwnerProfessional = assignment.professional.toString() === req.user._id.toString();
      const isOwnerCompany = assignment.request.createdBy.toString() === req.user._id.toString();
      const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
      if (!isOwnerProfessional && !isOwnerCompany && !isOperator) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      if (req.body.status === 'in_execution' && assignment.professionalDecision !== 'accepted' && !isOperator) {
        return res.status(400).json({ message: 'El profesional debe aceptar la asignación antes de iniciar' });
      }

      if (req.body.status === 'finished' && assignment.status !== 'in_execution') {
        return res.status(400).json({ message: 'Solo puedes finalizar asignaciones en ejecución' });
      }

      assignment.status = req.body.status;
      if (req.body.status === 'finished') {
        assignment.finishedAt = new Date();
        assignment.finalCertificateUrl = `/api/marketplace/assignments/${assignment._id}/certificate`;
        assignment.finalReportUrl = `/api/marketplace/assignments/${assignment._id}/final-report`;
      }
      await assignment.save();

      await MarketplaceRequest.findByIdAndUpdate(assignment.request._id, {
        status:
          req.body.status === 'in_execution'
            ? 'in_execution'
            : req.body.status === 'finished'
              ? 'finished'
              : req.body.status === 'cancelled'
                ? 'cancelled'
                : 'professional_selected',
      });

      await logAudit({
        user: req.user,
        action: 'update_marketplace_assignment_status',
        entity: 'MarketplaceAssignment',
        entityId: assignment._id,
        changes: { status: req.body.status },
        req,
      });

      res.json(assignment);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/assignments/:id/reports',
  [body('reportDate').isISO8601(), body('activities').trim().notEmpty(), body('workedHours').isFloat({ min: 0 })],
  async (req, res, next) => {
    try {
      if (!isProfessional(req.user)) {
        return res.status(403).json({ message: 'Solo profesionales SST pueden registrar reportes' });
      }
      if (!validate(req, res)) return;

      const assignment = await MarketplaceAssignment.findById(req.params.id);
      if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });
      if (assignment.professional.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Sin permisos' });
      }

      const report = await MarketplaceReport.create({
        assignment: assignment._id,
        professional: req.user._id,
        reportDate: req.body.reportDate,
        activities: req.body.activities,
        inspections: req.body.inspections,
        evidencePhotos: req.body.evidencePhotos || [],
        workedHours: req.body.workedHours,
        observations: req.body.observations,
      });

      await notifyUser(
        assignment.assignedBy,
        'new_marketplace_report',
        'Nuevo reporte de servicio',
        'El profesional registró un nuevo reporte en una asignación.',
        { assignmentId: assignment._id, reportId: report._id }
      );

      await logAudit({
        user: req.user,
        action: 'create_marketplace_report',
        entity: 'MarketplaceReport',
        entityId: report._id,
        req,
      });

      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/assignments/:id/reports', async (req, res, next) => {
  try {
    const assignment = await MarketplaceAssignment.findById(req.params.id).populate('request');
    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

    const allowed =
      assignment.professional.toString() === req.user._id.toString() ||
      assignment.request.createdBy.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);

    if (!allowed) return res.status(403).json({ message: 'Sin permisos' });

    const reports = await MarketplaceReport.find({ assignment: assignment._id }).sort({ reportDate: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/assignments/:id/ratings',
  [body('score').isInt({ min: 1, max: 5 }), body('comment').optional().trim()],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const assignment = await MarketplaceAssignment.findById(req.params.id).populate('request');
      if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

      const isProfessionalSide = assignment.professional.toString() === req.user._id.toString();
      const isCompanySide = assignment.request.createdBy.toString() === req.user._id.toString();
      if (!isProfessionalSide && !isCompanySide) {
        return res.status(403).json({ message: 'Solo participantes del servicio pueden calificar' });
      }

      const type = isCompanySide ? 'company_to_professional' : 'professional_to_company';
      const toUser = isCompanySide ? assignment.professional : assignment.request.createdBy;

      const rating = await MarketplaceRating.create({
        assignment: assignment._id,
        fromUser: req.user._id,
        toUser,
        type,
        score: req.body.score,
        comment: req.body.comment,
      });

      if (type === 'company_to_professional') {
        await recomputeProfessionalRating(assignment.professional);
      }

      await logAudit({
        user: req.user,
        action: 'create_marketplace_rating',
        entity: 'MarketplaceRating',
        entityId: rating._id,
        req,
      });

      res.status(201).json(rating);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Ya existe una calificación de este tipo para esta asignación' });
      }
      next(err);
    }
  }
);

router.get('/assignments/:id/ratings', async (req, res, next) => {
  try {
    const assignment = await MarketplaceAssignment.findById(req.params.id).populate('request');
    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

    const allowed =
      assignment.professional.toString() === req.user._id.toString() ||
      assignment.request.createdBy.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);

    if (!allowed) return res.status(403).json({ message: 'Sin permisos' });

    const ratings = await MarketplaceRating.find({ assignment: assignment._id })
      .populate('fromUser', 'profile email')
      .populate('toUser', 'profile email');

    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

router.get('/assignments/:id/final-report', async (req, res, next) => {
  try {
    const assignment = await MarketplaceAssignment.findById(req.params.id)
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company');

    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

    const isParticipant =
      assignment.professional?._id?.toString() === req.user._id.toString() ||
      assignment.request?.createdBy?.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
    if (!isParticipant && !isOperator) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const reports = await MarketplaceReport.find({ assignment: assignment._id }).sort({ reportDate: 1 });
    const totalHours = reports.reduce((acc, r) => acc + Number(r.workedHours || 0), 0);

    res.json({
      assignmentId: assignment._id,
      status: assignment.status,
      company: assignment.company,
      professional: assignment.professional,
      serviceType: assignment.request?.requiredProfessionalType,
      city: assignment.request?.city,
      startDate: assignment.request?.startDate,
      endDate: assignment.finishedAt || assignment.request?.estimatedEndDate,
      totalReports: reports.length,
      totalWorkedHours: totalHours,
      reports,
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments/:id/certificate', async (req, res, next) => {
  try {
    const assignment = await MarketplaceAssignment.findById(req.params.id)
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company');

    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

    const isParticipant =
      assignment.professional?._id?.toString() === req.user._id.toString() ||
      assignment.request?.createdBy?.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
    if (!isParticipant && !isOperator) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    res.json({
      certificateCode: `BEMC-MKT-${assignment._id.toString().slice(-8).toUpperCase()}`,
      assignmentId: assignment._id,
      companyName: assignment.company?.legalName,
      professionalName: `${assignment.professional?.profile?.firstName || ''} ${assignment.professional?.profile?.lastName || ''}`.trim(),
      serviceType: assignment.request?.requiredProfessionalType,
      city: assignment.request?.city,
      finishedAt: assignment.finishedAt,
      issuedAt: new Date(),
      message: 'Certificado de cumplimiento de servicio Marketplace SST.',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments/:id/contract-draft', async (req, res, next) => {
  try {
    const assignment = await MarketplaceAssignment.findById(req.params.id)
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company');

    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });

    const isParticipant =
      assignment.professional?._id?.toString() === req.user._id.toString() ||
      assignment.request?.createdBy?.toString() === req.user._id.toString();
    const isOperator = req.user.role === 'admin' || ['consultor', 'auxiliar', 'supervisor'].includes(req.user.role);
    if (!isParticipant && !isOperator) {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    res.json({
      assignmentId: assignment._id,
      serviceOrderCode: assignment.serviceOrderCode,
      contractStatus: assignment.contractStatus,
      contractDraftUrl: assignment.contractDraftUrl,
      signatureProvider: {
        enabled: false,
        provider: null,
        status: 'not_integrated',
      },
      parties: {
        company: assignment.company?.legalName,
        professional: `${assignment.professional?.profile?.firstName || ''} ${assignment.professional?.profile?.lastName || ''}`.trim(),
      },
      service: {
        type: assignment.request?.requiredProfessionalType,
        city: assignment.request?.city,
        startDate: assignment.request?.startDate,
        estimatedEndDate: assignment.request?.estimatedEndDate,
        agreedValue: assignment.agreedValue,
      },
      generatedAt: new Date(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }

    const [activeApplications, assignedServices, activeServices, finishedServices, certificationsCount, documentsCount] = await Promise.all([
      MarketplaceApplication.countDocuments({ professional: req.user._id, status: 'active' }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id, status: 'in_execution' }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id, status: 'finished' }),
      ProfessionalCertification.countDocuments({ professional: req.user._id }),
      ProfessionalDocument.countDocuments({ professional: req.user._id }),
    ]);

    const completion = computeProfileCompletion(req.user, certificationsCount, documentsCount);

    res.json({
      activeApplications,
      assignedServices,
      activeServices,
      finishedServices,
      profile: req.user.professionalProfile || {},
      completion,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/certifications/:id/verify', isStaff, async (req, res, next) => {
  try {
    const cert = await ProfessionalCertification.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedBy: req.user._id },
      { new: true }
    );
    if (!cert) return res.status(404).json({ message: 'Certificación no encontrada' });

    await logAudit({
      user: req.user,
      action: 'verify_professional_certification',
      entity: 'ProfessionalCertification',
      entityId: cert._id,
      req,
    });

    res.json(cert);
  } catch (err) {
    next(err);
  }
});

export default router;
