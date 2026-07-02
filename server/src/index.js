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

const clientDistPath = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
  console.log(`Serving static files from: ${clientDistPath}`);
  console.log(`Client dist exists: ${fs.existsSync(clientDistPath)}`);
  
  // Serve all static assets with proper defaults
  app.use(express.static(clientDistPath, { 
    maxAge: '1d',
    index: false  // Disable default index to use our custom logic
  }));
  
  // SPA fallback: serve index.html for all non-API, non-static routes
  app.get('*', (req, res, next) => {
    // Skip API routes - let them 404 naturally
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    // Serve index.html for all other routes (SPA)
    const indexFile = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).json({ message: 'Frontend not built' });
    }
  });
}

app.use(notFound);
app.use(errorHandler);

async function start() {
  console.log(`NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`Using client dist path: ${clientDistPath}`);
  console.log(`Client dist exists: ${fs.existsSync(clientDistPath)}`);
  
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
