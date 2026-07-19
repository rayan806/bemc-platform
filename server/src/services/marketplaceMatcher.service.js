/**
 * Archivo: server/src/services/marketplaceMatcher.service.js
 * Proposito: Motor de matching para encontrar profesionales SST compatibles.
 */

import { User } from '../models/User.js';
import { ProfessionalCertification } from '../models/ProfessionalCertification.js';

function normalize(text) {
  return (text || '').toString().trim().toLowerCase();
}

function hasValidSstLicense(profile) {
  const singleValid =
    profile?.licenseNumber &&
    profile?.licenseExpiryDate &&
    new Date(profile.licenseExpiryDate).getTime() >= Date.now();

  const listValid = Array.isArray(profile?.licenses)
    ? profile.licenses.some(
        (license) =>
          license?.number &&
          license?.expiryDate &&
          new Date(license.expiryDate).getTime() >= Date.now()
      )
    : false;

  return !!(singleValid || listValid);
}

export async function findMatchingProfessionals(request) {
  const city = normalize(request.city);
  const requiredType = normalize(request.requiredProfessionalType);
  const requiredService = normalize(request.requiredService || request.requiredProfessionalType);
  const requiredSpecialties = (request.requiredSpecialties || []).map(normalize).filter(Boolean);
  const minYearsExperience = Number(request.minYearsExperience || 0);
  const requiredAvailability = request.requiredAvailability || (request.requiresImmediateAvailability ? 'immediate' : 'this_week');

  const availabilityFilter =
    requiredAvailability === 'next_week' || requiredAvailability === 'specific_date'
      ? { $in: ['available', 'busy'] }
      : 'available';

  const professionals = await User.find({
    role: 'professional_sst',
    isActive: true,
    'professionalProfile.availabilityStatus': availabilityFilter,
  })
    .select('email profile professionalProfile')
    .lean();

  const byCoverage = professionals.filter((pro) => {
    const p = pro.professionalProfile || {};
    const mainCity = normalize(p.city);
    const municipalities = (p.serviceMunicipalities || []).map(normalize);
    return mainCity === city || municipalities.includes(city) || p.canTravel;
  });

  const byType = byCoverage.filter((pro) => {
    const p = pro.professionalProfile || {};
    const profession = normalize(p.mainProfession);
    const mainRole = normalize(p.mainRole);
    const services = (p.servicesOffered || []).map(normalize);
    if (!requiredType) return true;
    return (
      profession.includes(requiredType) ||
      mainRole.includes(requiredType) ||
      services.some((s) => s.includes(requiredService) || requiredService.includes(s))
    );
  });

  const byLicense = byType.filter((pro) => hasValidSstLicense(pro.professionalProfile));

  const bySpecialty = byLicense.filter((pro) => {
    if (!requiredSpecialties.length) return true;
    const p = pro.professionalProfile || {};
    const specialties = (p.specialties || []).map(normalize);
    return requiredSpecialties.every((s) => specialties.includes(s));
  });

  const byExperience = bySpecialty.filter((pro) => {
    if (!minYearsExperience) return true;
    const years = Number(pro.professionalProfile?.yearsExperience || 0);
    return years >= minYearsExperience;
  });

  const byAvailability = byExperience.filter((pro) => {
    if (requiredAvailability !== 'immediate' && !request.requiresImmediateAvailability) return true;
    return !!pro.professionalProfile?.immediateAvailability;
  });

  const ids = byAvailability.map((p) => p._id);
  const certifications = await ProfessionalCertification.find({ professional: { $in: ids } })
    .select('professional type expiresAt')
    .lean();

  const certMap = certifications.reduce((acc, cert) => {
    const key = cert.professional.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(cert);
    return acc;
  }, {});

  return byAvailability
    .map((pro) => {
      const p = pro.professionalProfile || {};
      const certs = certMap[pro._id.toString()] || [];
      const hasHeights = certs.some((c) => c.type === 'coordinador_alturas');
      const hasConfined = certs.some((c) => c.type === 'espacios_confinados');

      if (request.requiresWorkingAtHeights && !hasHeights) return null;
      if (request.requiresConfinedSpaces && !hasConfined) return null;

      return {
        _id: pro._id,
        email: pro.email,
        profile: pro.profile,
        professionalProfile: p,
        certificationsCount: certs.length,
        score: Number(p.ratingAvg || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.professionalProfile?.completedServicesCount || 0) -
        (a.professionalProfile?.completedServicesCount || 0);
    });
}
