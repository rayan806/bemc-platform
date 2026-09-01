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

function maskUri(uri) {
  try {
    if (!uri) return uri;
    // mask password between username:password@
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
  } catch (e) {
    return '***';
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemc';
  // Detect common misconfiguration: placeholder password still present
  if (String(uri).includes('<db_password>') || /<.+password.+>/i.test(String(uri))) {
    console.error('MONGODB_URI contiene un placeholder de contraseña (<db_password>). Actualiza la variable con la contraseña real en Render o en server/.env. Valor actual:', uri);
    throw new Error('MONGODB_URI no valida: falta contraseña real');
  }

  const connectionUri = getDirectAtlasUri(uri) || uri;

  try {
    await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 15000, useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB conectado:', maskUri(connectionUri));
    return;
  } catch (err) {
    // Log full error for debugging purposes but avoid leaking secrets
    console.error('No se pudo conectar a MongoDB. Intentando fallback. Error:', err && (err.stack || err));
    if (process.env.ALLOW_MEMORY_DB_FALLBACK === 'false') {
      // If fallback disabled, rethrow the error so process exits and Render shows failure
      throw err;
    }

    console.warn('MongoDB no disponible, usando almacenamiento local persistente. Error original (ver arriba)');
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
