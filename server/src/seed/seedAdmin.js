import { User } from '../models/User.js';

export async function seedAdminIfMissing() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bemc.com';
  const exists = await User.findOne({ email: adminEmail });
  if (exists) return;

  await User.create({
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
    accountType: 'person',
    authProviders: ['local'],
    profile: {
      firstName: 'Administrador',
      lastName: 'B.E.M.C',
    },
  });

  console.log(`Usuario admin creado: ${adminEmail}`);
  console.log('Cambia la contraseña después del primer inicio de sesión.');
}
