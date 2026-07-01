import crypto from 'crypto';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const oauthStates = new Map();

export function createOAuthState(provider) {
  const state = crypto.randomBytes(24).toString('hex');
  oauthStates.set(state, {
    provider,
    expires: Date.now() + 10 * 60 * 1000,
  });
  return state;
}

export function consumeOAuthState(state, provider) {
  const entry = oauthStates.get(state);
  if (!entry || entry.provider !== provider || entry.expires < Date.now()) {
    return false;
  }
  oauthStates.delete(state);
  return true;
}

export async function findOrCreateOAuthUser({
  provider,
  providerId,
  email,
  firstName,
  lastName,
  avatarUrl,
}) {
  const idField = provider === 'facebook' ? 'facebookId' : 'googleId';

  let user = await User.findOne({ [idField]: providerId }).populate('company');
  if (user) {
    user.lastLogin = new Date();
    await user.save();
    return user;
  }

  const normalizedEmail = email?.toLowerCase()?.trim();
  if (normalizedEmail) {
    user = await User.findOne({ email: normalizedEmail }).populate('company');
    if (user) {
      user[idField] = providerId;
      if (!user.authProviders.includes(provider)) {
        user.authProviders.push(provider);
      }
      if (avatarUrl && !user.profile?.avatarUrl) {
        user.profile = { ...user.profile, avatarUrl };
      }
      user.lastLogin = new Date();
      await user.save();
      return user;
    }
  }

  if (!normalizedEmail) {
    const err = new Error('El proveedor no compartió tu correo. Usa registro con email.');
    err.code = 'NO_EMAIL';
    throw err;
  }

  user = await User.create({
    email: normalizedEmail,
    authProviders: [provider],
    [idField]: providerId,
    accountType: 'person',
    role: 'client',
    profile: {
      firstName: firstName || 'Usuario',
      lastName: lastName || '',
      avatarUrl,
    },
  });

  return User.findById(user._id).populate('company');
}

export function redirectWithToken(res, user) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const token = signToken({ id: user._id, role: user.role });
  res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(token)}`);
}

export function redirectWithError(res, code) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(code)}`);
}

export async function exchangeFacebookCode(code) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri =
    process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback';

  const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error?.message || 'Error al obtener token de Facebook');
  }

  const profileUrl = new URL('https://graph.facebook.com/me');
  profileUrl.searchParams.set('fields', 'id,email,first_name,last_name,picture.type(large)');
  profileUrl.searchParams.set('access_token', tokenData.access_token);

  const profileRes = await fetch(profileUrl);
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.id) {
    throw new Error(profile.error?.message || 'Error al leer perfil de Facebook');
  }

  return {
    providerId: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.picture?.data?.url,
  };
}

export async function exchangeGoogleCode(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || 'Error al obtener token de Google');
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.id) {
    throw new Error('Error al leer perfil de Google');
  }

  return {
    providerId: profile.id,
    email: profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    avatarUrl: profile.picture,
  };
}
