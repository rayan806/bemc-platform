import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import requestsRoutes from './routes/requests.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import { seedServicesIfEmpty } from './seed/seedServices.js';
import { seedAdminIfMissing } from './seed/seedAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.warn('ADVERTENCIA: JWT_SECRET no definido. Usa server/.env');
  process.env.JWT_SECRET = 'dev-secret-change-in-production';
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: 'Demasiados intentos' }),
  authRoutes
);

app.use('/api/services', servicesRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'B.E.M.C API' });
});

// =========================
// PRODUCTION STATIC SERVING
// =========================
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA Fallback: Serve index.html for any route not starting with /api or /uploads
app.get('*', (req, res) => {
  // Don't serve SPA for API or upload routes
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ message: 'Ruta no encontrada' });
  }
  // Serve SPA  
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).json({ message: 'Aplicación no disponible' });
  }
});
// =========================

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  await seedServicesIfEmpty();
  await seedAdminIfMissing();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API B.E.M.C en http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
