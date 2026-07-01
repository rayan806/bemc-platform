import { Router } from 'express';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Payment } from '../models/Payment.js';
import { Document } from '../models/Document.js';
import { authenticate, isStaff } from '../middleware/auth.js';

const router = Router();

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
    ] = await Promise.all([
      User.countDocuments({ role: 'client', isActive: true }),
      Company.countDocuments({ isActive: true }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'pending' }),
      Document.countDocuments(),
      ServiceRequest.countDocuments({ status: 'pending_payment' }),
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
