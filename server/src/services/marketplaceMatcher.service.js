/**
 * Archivo: server/src/services/marketplaceMatcher.service.js
 * Proposito: Motor de matching para encontrar profesionales SST compatibles.
 */

import { User } from '../models/User.js';
import { ProfessionalCertification } from '../models/ProfessionalCertification.js';
import {
  normalizeLocationText,
  resolveCitySelection,
} from './locationCatalog.service.js';

function normalize(text) {
  return (text || '').toString().trim().toLowerCase();
}

function isSstText(text) {
  const value = normalize(text);
  return (
    value.includes('sst') ||
    value.includes('seguridad y salud en el trabajo') ||
    value.includes('salud ocupacional')
  );
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
  const requestedCity = resolveCitySelection({ cityCode: request.cityCode }) || resolveCitySelection(request.city);
  const requestedCityText = normalizeLocationText(request.city);
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
    const byCode =
      !!requestedCity &&
      (p.cityCode === requestedCity.cityCode || (p.serviceMunicipalityCodes || []).includes(requestedCity.cityCode));
    const byText =
      normalizeLocationText(p.city) === requestedCityText ||
      (p.serviceMunicipalities || []).map((cityName) => normalizeLocationText(cityName)).includes(requestedCityText);
    return byCode || byText || p.canTravel;
  });

  // Si por cobertura no hay nada (datos incompletos o ciudad no cubierta),
  // se abre el universo a disponibles para evitar listas vacias.
  const baseCandidates = byCoverage.length > 0 ? byCoverage : professionals;

  const typeMatches = baseCandidates.filter((pro) => {
    const p = pro.professionalProfile || {};
    const profession = normalize(p.mainProfession);
    const mainRole = normalize(p.mainRole);
    const services = (p.servicesOffered || []).map(normalize);
    const specialty = normalize(p.specialty);
    if (!requiredType) return true;

    const requiresSst = isSstText(requiredType) || isSstText(requiredService);
    const hasSstProfile =
      isSstText(profession) ||
      isSstText(mainRole) ||
      isSstText(specialty) ||
      services.some((s) => isSstText(s));

    return (
      profession.includes(requiredType) ||
      mainRole.includes(requiredType) ||
      services.some((s) => s.includes(requiredService) || requiredService.includes(s)) ||
      (requiresSst && hasSstProfile)
    );
  });

  const byType = requiredType && typeMatches.length > 0 ? typeMatches : baseCandidates;

  const specialtyMatches = byType.filter((pro) => {
    if (!requiredSpecialties.length) return false;
    const p = pro.professionalProfile || {};
    const specialties = (p.specialties || []).map(normalize);
    return requiredSpecialties.some((requested) =>
      specialties.some((have) => have.includes(requested) || requested.includes(have))
    );
  });

  const bySpecialty = requiredSpecialties.length && specialtyMatches.length > 0 ? specialtyMatches : byType;

  const experienceMatches = bySpecialty.filter((pro) => {
    if (!minYearsExperience) return false;
    const years = Number(pro.professionalProfile?.yearsExperience || 0);
    return years >= minYearsExperience;
  });

  const byExperience = minYearsExperience > 0 && experienceMatches.length > 0 ? experienceMatches : bySpecialty;

  const immediateMatches = byExperience.filter((pro) => {
    if (requiredAvailability !== 'immediate' && !request.requiresImmediateAvailability) return false;
    return !!pro.professionalProfile?.immediateAvailability;
  });

  const byAvailability =
    (requiredAvailability === 'immediate' || request.requiresImmediateAvailability) && immediateMatches.length > 0
      ? immediateMatches
      : byExperience;

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

      // Puntaje compuesto para priorizar coincidencia, sin eliminar candidatos utiles.
      let score = Number(p.ratingAvg || 0);
      if (requiredType) {
        const profession = normalize(p.mainProfession);
        const mainRole = normalize(p.mainRole);
        const services = (p.servicesOffered || []).map(normalize);
        if (profession.includes(requiredType) || mainRole.includes(requiredType)) score += 2;
        if (services.some((s) => s.includes(requiredService) || requiredService.includes(s))) score += 1.5;
      }
      if (requiredSpecialties.length > 0) {
        const specialties = (p.specialties || []).map(normalize);
        const specialtyHits = requiredSpecialties.filter((requested) =>
          specialties.some((have) => have.includes(requested) || requested.includes(have))
        ).length;
        score += specialtyHits;
      }
      if (minYearsExperience > 0) {
        const years = Number(p.yearsExperience || 0);
        if (years >= minYearsExperience) score += 1;
      }
      if (hasValidSstLicense(p)) score += 1;
      if (p.immediateAvailability) score += 0.5;

      return {
        _id: pro._id,
        email: pro.email,
        profile: pro.profile,
        professionalProfile: p,
        certificationsCount: certs.length,
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.professionalProfile?.completedServicesCount || 0) -
        (a.professionalProfile?.completedServicesCount || 0);
    });
}
