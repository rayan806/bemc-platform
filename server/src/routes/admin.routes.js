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
import { MarketplaceApplication } from '../models/MarketplaceApplication.js';
import { MarketplaceAssignment } from '../models/MarketplaceAssignment.js';
import { MarketplaceRating } from '../models/MarketplaceRating.js';
import { MarketplaceReport } from '../models/MarketplaceReport.js';
import { PublicQuote } from '../models/PublicQuote.js';
import { authenticate, isStaff } from '../middleware/auth.js';

const router = Router();
const systemConfigState = {
  maintenanceMode: false,
  allowPublicQuotes: true,
  notificationsEnabled: true,
  updatedAt: new Date(),
};

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

router.get('/professionals', async (req, res, next) => {
  try {
    const professionals = await User.find({ role: 'professional_sst' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(professionals);
  } catch (err) {
    next(err);
  }
});

router.patch('/clients/:id/status', async (req, res, next) => {
  try {
    const isActive = req.body.isActive !== false;
    const client = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'client' },
      { isActive },
      { new: true }
    ).select('-password');

    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    next(err);
  }
});

router.patch('/professionals/:id/status', async (req, res, next) => {
  try {
    const isActive = req.body.isActive !== false;
    const professional = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'professional_sst' },
      { isActive },
      { new: true }
    ).select('-password');

    if (!professional) return res.status(404).json({ message: 'Profesional no encontrado' });
    res.json(professional);
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

router.patch('/companies/:id/status', async (req, res, next) => {
  try {
    const isActive = req.body.isActive !== false;
    const company = await Company.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

router.get('/marketplace/requests', async (req, res, next) => {
  try {
    const requests = await MarketplaceRequest.find()
      .populate('company')
      .populate('createdBy', 'email profile')
      .populate('selectedProfessional', 'email profile professionalProfile')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/marketplace/assignments', async (req, res, next) => {
  try {
    const assignments = await MarketplaceAssignment.find()
      .populate('request')
      .populate('professional', 'email profile professionalProfile')
      .populate('company')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.get('/marketplace/reports', async (req, res, next) => {
  try {
    const reports = await MarketplaceReport.find()
      .populate('assignment')
      .populate('professional', 'email profile')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.get('/marketplace/ratings', async (req, res, next) => {
  try {
    const ratings = await MarketplaceRating.find()
      .populate('assignment')
      .populate('fromUser', 'email profile')
      .populate('toUser', 'email profile')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(ratings);
  } catch (err) {
    next(err);
  }
});

router.get('/public-quotes', async (req, res, next) => {
  try {
    const quotes = await PublicQuote.find().sort({ createdAt: -1 }).limit(200);
    res.json(quotes);
  } catch (err) {
    next(err);
  }
});

router.patch('/public-quotes/:id/status', async (req, res, next) => {
  try {
    const quote = await PublicQuote.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || 'in_review' },
      { new: true }
    );
    if (!quote) return res.status(404).json({ message: 'Cotizacion no encontrada' });
    res.json(quote);
  } catch (err) {
    next(err);
  }
});

router.get('/documents', async (req, res, next) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'email profile')
      .populate('serviceRequest')
      .sort({ createdAt: -1 })
      .limit(300);
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

router.patch('/documents/:id/review', async (req, res, next) => {
  try {
    const patch = {
      isApproved: req.body.isApproved,
      reviewNotes: req.body.reviewNotes,
      reviewedBy: req.user._id,
    };
    const doc = await Document.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/system-config', async (req, res) => {
  res.json(systemConfigState);
});

router.put('/system-config', async (req, res) => {
  systemConfigState.maintenanceMode = req.body.maintenanceMode === true;
  systemConfigState.allowPublicQuotes = req.body.allowPublicQuotes !== false;
  systemConfigState.notificationsEnabled = req.body.notificationsEnabled !== false;
  systemConfigState.updatedAt = new Date();
  res.json(systemConfigState);
});

router.get('/stats/extended', async (req, res, next) => {
  try {
    const [
      totalServiceRequests,
      totalMarketplaceRequests,
      totalMarketplaceApplications,
      totalMarketplaceAssignments,
      totalMarketplaceReports,
      totalMarketplaceRatings,
      totalPublicQuotes,
      requestsByStatus,
      marketplaceByStatus,
      paymentsByStatus,
    ] = await Promise.all([
      ServiceRequest.countDocuments(),
      MarketplaceRequest.countDocuments(),
      MarketplaceApplication.countDocuments(),
      MarketplaceAssignment.countDocuments(),
      MarketplaceReport.countDocuments(),
      MarketplaceRating.countDocuments(),
      PublicQuote.countDocuments(),
      ServiceRequest.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
      MarketplaceRequest.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
      Payment.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]),
    ]);

    res.json({
      totals: {
        totalServiceRequests,
        totalMarketplaceRequests,
        totalMarketplaceApplications,
        totalMarketplaceAssignments,
        totalMarketplaceReports,
        totalMarketplaceRatings,
        totalPublicQuotes,
      },
      distributions: {
        serviceRequests: requestsByStatus,
        marketplaceRequests: marketplaceByStatus,
        payments: paymentsByStatus,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
