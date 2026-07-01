import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Service } from '../models/Service.js';
import { authenticate, isAdmin, isStaff } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const services = await Service.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json(services);
  } catch (err) {
    next(err);
  }
});

router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const service =
      (await Service.findOne({ slug: slugOrId })) ||
      (await Service.findById(slugOrId));
    if (!service || (!service.isActive && !req.user)) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    res.json(service);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('category').optional(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const service = await Service.create(req.body);
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await Service.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Servicio desactivado' });
  } catch (err) {
    next(err);
  }
});

export default router;
