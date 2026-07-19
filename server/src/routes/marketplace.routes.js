/**
 * Archivo: server/src/routes/marketplace.routes.js
 * Proposito: Modulo Marketplace SST (solicitudes, postulaciones, asignaciones y seguimiento).
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, isStaff } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { MarketplaceRequest, MARKETPLACE_REQUEST_STATUSES } from '../models/MarketplaceRequest.js';
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
import { Notification } from '../models/Notification.js';
import { logAudit } from '../utils/audit.js';
import { findMatchingProfessionals } from '../services/marketplaceMatcher.service.js';

const router = Router();

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

async function notifyUser(userId, type, title, message, payload = {}) {
  await Notification.create({ user: userId, type, title, message, payload, channel: 'in_app' });
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

router.get('/professionals/public', async (req, res, next) => {
  try {
    const city = (req.query.city || '').trim();
    const specialty = (req.query.specialty || '').trim().toLowerCase();
    const type = (req.query.type || '').trim().toLowerCase();

    const professionals = await User.find({
      role: 'professional_sst',
      isActive: true,
      'professionalProfile.availabilityStatus': { $ne: 'unavailable' },
    })
      .select('profile professionalProfile')
      .lean();

    const filtered = professionals.filter((p) => {
      const prof = p.professionalProfile || {};
      if (city) {
        const inMainCity = (prof.city || '').toLowerCase() === city.toLowerCase();
        const inMunicipality = (prof.serviceMunicipalities || [])
          .map((m) => (m || '').toLowerCase())
          .includes(city.toLowerCase());
        if (!inMainCity && !inMunicipality && !prof.canTravel) return false;
      }
      if (specialty) {
        const specialties = (prof.specialties || []).map((s) => (s || '').toLowerCase());
        if (!specialties.includes(specialty)) return false;
      }
      if (type) {
        const profession = (prof.mainProfession || '').toLowerCase();
        const mainRole = (prof.mainRole || '').toLowerCase();
        if (!profession.includes(type) && !mainRole.includes(type)) return false;
      }
      return true;
    });

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

router.get('/professionals/me', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }
    const certifications = await ProfessionalCertification.find({ professional: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ user: req.user.toSafeJSON(), certifications });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/professionals/me',
  [
    body('professionalProfile').isObject(),
    body('professionalProfile.yearsExperience').optional().isInt({ min: 0 }),
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
        'yearsExperience',
        'licenseNumber',
        'licenseExpiryDate',
        'specialties',
        'city',
        'department',
        'serviceMunicipalities',
        'canTravel',
        'availabilityStatus',
      ];

      const patch = {};
      for (const key of allowed) {
        if (req.body.professionalProfile?.[key] !== undefined) {
          patch[`professionalProfile.${key}`] = req.body.professionalProfile[key];
        }
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

router.post(
  '/requests',
  [
    body('contactName').trim().notEmpty(),
    body('contactPhone').trim().notEmpty(),
    body('contactEmail').isEmail(),
    body('city').trim().notEmpty(),
    body('department').trim().notEmpty(),
    body('startDate').isISO8601(),
    body('requiredProfessionalType').trim().notEmpty(),
    body('workersCount').isInt({ min: 1 }),
    body('description').trim().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      if (!isCompanyClient(req.user) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Solo empresas registradas pueden crear solicitudes' });
      }
      if (!validate(req, res)) return;

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
        city: req.body.city,
        department: req.body.department,
        address: req.body.address,
        startDate: req.body.startDate,
        estimatedEndDate: req.body.estimatedEndDate,
        requiredProfessionalType: req.body.requiredProfessionalType,
        workersCount: req.body.workersCount,
        riskLevel: req.body.riskLevel,
        schedule: req.body.schedule,
        requiresWorkingAtHeights: !!req.body.requiresWorkingAtHeights,
        requiresConfinedSpaces: !!req.body.requiresConfinedSpaces,
        requiredSpecialties: req.body.requiredSpecialties || [],
        description: req.body.description,
        attachments: req.body.attachments || [],
        status: req.body.publishNow ? 'published' : 'draft',
      });

      if (request.status === 'published') {
        const matches = await findMatchingProfessionals(request);
        for (const pro of matches) {
          await notifyUser(
            pro._id,
            'marketplace_match',
            'Nueva solicitud compatible',
            'Existe una solicitud que coincide con tu perfil profesional SST.',
            { requestId: request._id }
          );
        }
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

    const openRequests = await MarketplaceRequest.find({
      status: { $in: ['published', 'in_postulation'] },
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
        const matches = await findMatchingProfessionals(request);
        for (const pro of matches) {
          await notifyUser(
            pro._id,
            'marketplace_match',
            'Solicitud abierta para postulación',
            'Se publicó una solicitud compatible con tu perfil.',
            { requestId: request._id }
          );
        }
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
        await request.save();
      }

      await notifyUser(
        request.createdBy._id,
        'new_application',
        'Nueva postulación recibida',
        'Un profesional SST se postuló a tu solicitud.',
        { requestId: request._id, applicationId: application._id }
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

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

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

      const assignment = await MarketplaceAssignment.create({
        request: request._id,
        professional: req.body.professionalId,
        company: request.company,
        assignedBy: req.user._id,
        assignedAt: new Date(),
        agreedValue: req.body.agreedValue,
        status: 'assigned',
      });

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
      if (err.code === 11000) {
        return res.status(409).json({ message: 'La solicitud ya tiene una asignación activa' });
      }
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

router.get('/summary', async (req, res, next) => {
  try {
    if (!isProfessional(req.user)) {
      return res.status(403).json({ message: 'Solo profesionales SST' });
    }

    const [activeApplications, assignedServices, activeServices, finishedServices] = await Promise.all([
      MarketplaceApplication.countDocuments({ professional: req.user._id, status: 'active' }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id, status: 'in_execution' }),
      MarketplaceAssignment.countDocuments({ professional: req.user._id, status: 'finished' }),
    ]);

    res.json({
      activeApplications,
      assignedServices,
      activeServices,
      finishedServices,
      profile: req.user.professionalProfile || {},
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
