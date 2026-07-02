/**
 * Archivo: server/src/config/db.js
 * Proposito: Conexion a MongoDB y fallback en memoria para desarrollo.
 */

import mongoose from 'mongoose';

let memoryServer;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemc';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB conectado:', uri.replace(/\/\/[^@]+@/, '//***@'));
    return;
  } catch (err) {
    const isLocal =
      uri.includes('127.0.0.1') || uri.includes('localhost');
    if (process.env.NODE_ENV === 'production' || !isLocal) {
      console.error('No se pudo conectar a MongoDB:', err.message);
      throw err;
    }
    console.warn('MongoDB local no disponible, usando base en memoria para desarrollo...');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memUri = memoryServer.getUri('bemc');
  await mongoose.connect(memUri);
  console.log('MongoDB en memoria activo (los datos se pierden al cerrar el servidor)');
}
