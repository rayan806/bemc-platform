/**
 * Archivo: server/src/routes/admin.routes.js
 * Proposito: Rutas administrativas de tablero y gestion.
 */

import { Router } from 'express';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Payment } from '../models/Payment.js';
import { Document } from '../models/Document.js';
import { MarketplaceRequest } from '../models/MarketplaceRequest.js';
import { MarketplaceAssignment } from '../models/MarketplaceAssignment.js';
import { MarketplaceRating } from '../models/MarketplaceRating.js';
import { authenticate, isStaff } from '../middleware/auth.js';

const router = Router();

// Aqui se definen los endpoints de este modulo.

router.use(authenticate, isStaff);

router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalClients,
      totalCompanies,
      activeServices,
      completedServices,
      paidPayments,
      pendingPayments,
      totalDocuments,
      newRequests,
      totalProfessionals,
      marketplaceActiveRequests,
      marketplaceFinishedRequests,
      availableProfessionals,
      marketplaceServicesInExecution,
      avgProfessionalRating,
      avgCompanyRating,
    ] = await Promise.all([
      User.countDocuments({ role: 'client', isActive: true }),
      Company.countDocuments({ isActive: true }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'pending' }),
      Document.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending_payment' }),
      User.countDocuments({ role: 'professional_sst', isActive: true }),
      MarketplaceRequest.countDocuments({ status: { $in: ['published', 'in_postulation', 'professional_selected', 'in_execution'] } }),
      MarketplaceRequest.countDocuments({ status: 'finished' }),
      User.countDocuments({ role: 'professional_sst', 'professionalProfile.availabilityStatus': 'available', isActive: true }),
      MarketplaceAssignment.countDocuments({ status: 'in_execution' }),
      MarketplaceRating.aggregate([
        { $match: { type: 'company_to_professional' } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]),
      MarketplaceRating.aggregate([
        { $match: { type: 'professional_to_company' } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]),
    ]);

    const recentRequests = await ServiceRequest.find()
      .populate('client', 'email profile')
      .populate('service', 'name price')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalClients,
        totalCompanies,
        activeServices,
        completedServices,
        paidPayments,
        pendingPayments,
        totalDocuments,
        newRequests,
        totalProfessionals,
        marketplaceActiveRequests,
        marketplaceFinishedRequests,
        availableProfessionals,
        marketplaceServicesInExecution,
        avgProfessionalRating: Number(avgProfessionalRating?.[0]?.avg || 0).toFixed(2),
        avgCompanyRating: Number(avgCompanyRating?.[0]?.avg || 0).toFixed(2),
      },
      recentRequests,
      alerts: [
        ...(pendingPayments > 0
          ? [{ type: 'payment', message: `${pendingPayments} pagos pendientes` }]
          : []),
        ...(newRequests > 0
          ? [{ type: 'request', message: `${newRequests} solicitudes esperando pago` }]
          : []),
      ],
    });
  } catch (err) {
    next(err);
  }
});

router.get('/clients', async (req, res, next) => {
  try {
    const clients = await User.find({ role: 'client' })
      .populate('company')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

router.get('/companies', async (req, res, next) => {
  try {
    const companies = await Company.find()
      .populate('createdBy', 'email profile')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    next(err);
  }
});

export default router;
