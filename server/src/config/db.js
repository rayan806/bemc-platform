/**
 * Archivo: server/src/config/db.js
 * Proposito: Conexion a MongoDB y fallback en memoria para desarrollo.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let memoryServer;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const persistentDbPath = path.join(__dirname, '../../data/mongodb');

function getDirectAtlasUri(uri) {
  if (!uri?.startsWith('mongodb+srv://')) return null;
  const parsed = new URL(uri);
  if (parsed.hostname !== 'bemc.pukz70u.mongodb.net') return null;

  const hosts = [
    'ac-ar28ax4-shard-00-00.pukz70u.mongodb.net:27017',
    'ac-ar28ax4-shard-00-01.pukz70u.mongodb.net:27017',
    'ac-ar28ax4-shard-00-02.pukz70u.mongodb.net:27017',
  ].join(',');
  const query = new URLSearchParams(parsed.search);
  query.set('tls', 'true');
  query.set('authSource', 'admin');
  query.set('replicaSet', 'atlas-avecks-shard-0');
  return `mongodb://${parsed.username}:${parsed.password}@${hosts}${parsed.pathname}?${query.toString()}`;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemc';
  const connectionUri = getDirectAtlasUri(uri) || uri;

  try {
    await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB conectado:', connectionUri.replace(/\/\/[^@]+@/, '//***@'));
    return;
  } catch (err) {
    const isLocal =
      uri.includes('127.0.0.1') || uri.includes('localhost');
    if (process.env.NODE_ENV === 'production' || !isLocal) {
      console.error('No se pudo conectar a MongoDB:', err.message);
      throw err;
    }
    console.warn('MongoDB local no disponible, usando almacenamiento local persistente para desarrollo...');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(persistentDbPath, { recursive: true });
  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbPath: persistentDbPath,
      storageEngine: 'wiredTiger',
    },
  });
  const memUri = memoryServer.getUri('bemc');
  await mongoose.connect(memUri);
  console.log(`MongoDB local persistente activo en ${persistentDbPath}`);
}
