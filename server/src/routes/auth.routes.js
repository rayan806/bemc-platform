/**
 * Archivo: server/src/routes/auth.routes.js
 * Proposito: Rutas de autenticacion, perfil y OAuth.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { signToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import {
  createOAuthState,
  consumeOAuthState,
  findOrCreateOAuthUser,
  redirectWithToken,
  redirectWithError,
  exchangeFacebookCode,
  exchangeGoogleCode,
} from '../services/oauth.service.js';

const router = Router();

// Aqui se definen los endpoints de este modulo.

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
    return false;
  }
  return true;
}

function sendAuthResponse(res, user) {
  const token = signToken({ id: user._id, role: user.role });
  return res.json({
    token,
    user: user.toSafeJSON(),
  });
}

function oauthStartUrl(provider, buildUrl) {
  return (req, res) => {
    const config = buildUrl();
    if (!config) {
      return res.status(503).json({
        message: `${provider === 'facebook' ? 'Facebook' : 'Google'} no configurado. Revisa las variables en server/.env`,
      });
    }
    const state = createOAuthState(provider);
    const url = new URL(config.base);
    Object.entries(config.params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('state', state);
    res.json({ url: url.toString() });
  };
}

function oauthCallback(provider, exchangeCode) {
  return async (req, res, next) => {
    try {
      const { code, state, error } = req.query;
      if (error) {
        return redirectWithError(res, error);
      }
      if (!code || !state || !consumeOAuthState(state, provider)) {
        return redirectWithError(res, 'invalid_state');
      }

      const profile = await exchangeCode(code);
      const user = await findOrCreateOAuthUser({
        provider,
        providerId: profile.providerId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
      });

      await logAudit({
        user,
        action: 'oauth_login',
        entity: 'User',
        entityId: user._id,
        changes: { provider },
        req,
      });

      redirectWithToken(res, user);
    } catch (err) {
      if (err.code === 'NO_EMAIL') {
        return redirectWithError(res, 'no_email');
      }
      console.error(`OAuth ${provider} error:`, err.message);
      redirectWithError(res, 'oauth_failed');
    }
  };
}

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('accountType').isIn(['person', 'company']),
    body('firstName').trim().notEmpty(),
    body('lastName').optional().trim(),
    body('phone').optional().trim(),
    body('documentNumber').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const {
        email,
        password,
        accountType,
        firstName,
        lastName,
        phone,
        documentNumber,
        address,
        company: companyData,
      } = req.body;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }

      if (accountType === 'company') {
        if (!companyData?.legalName || !companyData?.nit) {
          return res.status(400).json({
            message: 'Para empresa se requiere razón social y NIT',
          });
        }
      }

      const user = await User.create({
        email,
        password,
        accountType,
        role: 'client',
        authProviders: ['local'],
        profile: {
          firstName,
          lastName,
          phone,
          documentNumber,
          address,
        },
      });

      if (accountType === 'company') {
        const company = await Company.create({
          legalName: companyData.legalName,
          nit: companyData.nit,
          address: companyData.address,
          phone: companyData.phone || phone,
          email: companyData.email || email,
          legalRepresentative:
            companyData.legalRepresentative || `${firstName} ${lastName || ''}`.trim(),
          createdBy: user._id,
        });
        user.company = company._id;
        await user.save();
      }

      await logAudit({
        user,
        action: 'register',
        entity: 'User',
        entityId: user._id,
        req,
      });

      const populated = await User.findById(user._id).populate('company');
      sendAuthResponse(res, populated);
    } catch (err) {
      next(err);
    }
  }
);

function findUserByIdentifier(identifier) {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');
  if (isEmail) {
    return User.findOne({ email: trimmed.toLowerCase() })
      .select('+password')
      .populate('company');
  }
  const phoneDigits = trimmed.replace(/\D/g, '');
  return User.findOne({
    $or: [{ 'profile.phone': trimmed }, { 'profile.phone': phoneDigits }],
  })
    .select('+password')
    .populate('company');
}

router.post(
  '/login',
  [body('identifier').trim().notEmpty(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const identifier = req.body.identifier || req.body.email;
      const { password } = req.body;
      const user = await findUserByIdentifier(identifier);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }

      if (!user.password) {
        const providers = user.authProviders.filter((p) => p !== 'local').join(', ');
        return res.status(400).json({
          message: `Esta cuenta usa inicio con ${providers || 'red social'}. Usa ese botón para entrar.`,
        });
      }

      const valid = await user.comparePassword(password);
      if (!valid) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
      }

      user.lastLogin = new Date();
      await user.save();

      await logAudit({
        user,
        action: 'login',
        entity: 'User',
        entityId: user._id,
        req,
      });

      sendAuthResponse(res, user);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.post(
  '/forgot-password',
  [body('identifier').trim().notEmpty()],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const user = await findUserByIdentifier(req.body.identifier);
      const response = {
        message:
          'Si el correo o teléfono está registrado, recibirás instrucciones para restablecer tu contraseña.',
      };

      if (user && user.isActive && user.password) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        if (process.env.NODE_ENV !== 'production') {
          response.resetToken = resetToken;
        }
        // TODO: enviar correo con enlace en producción
      }

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const hashed = crypto.createHash('sha256').update(req.body.token).digest('hex');
      const user = await User.findOne({
        passwordResetToken: hashed,
        passwordResetExpires: { $gt: Date.now() },
      }).select('+password');

      if (!user) {
        return res.status(400).json({ message: 'Enlace inválido o expirado' });
      }

      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      if (!user.authProviders.includes('local')) {
        user.authProviders.push('local');
      }
      await user.save();

      res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/change-password',
  authenticate,
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  async (req, res, next) => {
    try {
      if (!handleValidation(req, res)) return;

      const user = await User.findById(req.user._id).select('+password');
      const valid = await user.comparePassword(req.body.currentPassword);
      if (!valid) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }

      user.password = req.body.newPassword;
      if (!user.authProviders.includes('local')) {
        user.authProviders.push('local');
      }
      await user.save();

      res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
      next(err);
    }
  }
);

// —— Facebook OAuth ——
router.get(
  '/facebook',
  oauthStartUrl('facebook', () => {
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) return null;
    const redirectUri =
      process.env.FACEBOOK_CALLBACK_URL ||
      'http://localhost:5000/api/auth/facebook/callback';
    return {
      base: 'https://www.facebook.com/v18.0/dialog/oauth',
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        scope: 'email,public_profile',
        response_type: 'code',
      },
    };
  })
);

router.get('/facebook/callback', oauthCallback('facebook', exchangeFacebookCode));

// —— Google OAuth ——
router.get(
  '/google',
  oauthStartUrl('google', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return null;
    const redirectUri =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:5000/api/auth/google/callback';
    return {
      base: 'https://accounts.google.com/o/oauth2/v2/auth',
      params: {
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'online',
        prompt: 'select_account',
      },
    };
  })
);

router.get('/google/callback', oauthCallback('google', exchangeGoogleCode));

export default router;
