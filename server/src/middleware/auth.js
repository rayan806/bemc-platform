import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const decoded = verifyToken(header.slice(7));
    const user = await User.findById(decoded.id).populate('company');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario no válido' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    next();
  };
}

export const isAdmin = authorize('admin');
export const isStaff = authorize('admin', 'consultor', 'auxiliar', 'supervisor');
