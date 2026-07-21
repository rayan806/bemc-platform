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
    value.includes('siso') ||
    value.includes('sst') ||
    value.includes('sg-sst') ||
    value.includes('seguridad industrial') ||
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

function isCertValid(cert) {
  if (!cert) return false;
  if (!cert.expiresAt) return true;
  return new Date(cert.expiresAt).getTime() >= Date.now();
}

function matchesProfessionalType(profile, requiredType, requiredService) {
  const profession = normalize(profile?.mainProfession);
  const mainRole = normalize(profile?.mainRole);
  const services = (profile?.servicesOffered || []).map(normalize);
  const specialty = normalize(profile?.specialty);

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
}

function hasCoverageForCity(profile, requestedCity, requestedCityText) {
  const p = profile || {};
  const mode = p.geographicAvailability || 'city_only';
  const nationwide = mode === 'nationwide' || !!p.canTravel;
  if (nationwide) return true;

  if (!requestedCity && !requestedCityText) return true;

  const sameCityByCode =
    !!requestedCity &&
    (p.cityCode === requestedCity.cityCode || (p.serviceMunicipalityCodes || []).includes(requestedCity.cityCode));
  const sameCityByText =
    normalizeLocationText(p.city) === requestedCityText ||
    (p.serviceMunicipalities || []).map((name) => normalizeLocationText(name)).includes(requestedCityText);
  const inRequestedDepartment =
    !!requestedCity &&
    (p.departmentCode === requestedCity.departmentCode ||
      (p.serviceDepartmentCodes || []).includes(requestedCity.departmentCode));

  if (mode === 'city_only') return sameCityByCode || sameCityByText;
  if (mode === 'city_nearby') return sameCityByCode || sameCityByText;
  if (mode === 'department') return inRequestedDepartment || sameCityByCode || sameCityByText;
  if (mode === 'multi_department') return inRequestedDepartment || sameCityByCode || sameCityByText;

  return sameCityByCode || sameCityByText;
}

function getGeographicPriority(profile, requestedCity, requestedCityText) {
  const p = profile || {};
  const mode = p.geographicAvailability || 'city_only';
  const nationwide = mode === 'nationwide' || !!p.canTravel;
  if (nationwide) return 3;

  if (!requestedCity && !requestedCityText) return 1;

  const sameCityByCode =
    !!requestedCity &&
    (p.cityCode === requestedCity.cityCode || (p.serviceMunicipalityCodes || []).includes(requestedCity.cityCode));
  const sameCityByText =
    normalizeLocationText(p.city) === requestedCityText ||
    (p.serviceMunicipalities || []).map((name) => normalizeLocationText(name)).includes(requestedCityText);

  if (sameCityByCode || sameCityByText) {
    return p.cityCode === requestedCity?.cityCode || normalizeLocationText(p.city) === requestedCityText ? 1 : 2;
  }

  return 4;
}

export async function findMatchingProfessionals(request) {
  const requestedCity = resolveCitySelection({ cityCode: request.cityCode }) || resolveCitySelection(request.city);
  const requestedCityText = normalizeLocationText(request.city);
  const requiredType = normalize(request.requiredProfessionalType);
  const requiredService = normalize(request.requiredService || request.requiredProfessionalType);
  const requiredSpecialties = (request.requiredSpecialties || []).map(normalize).filter(Boolean);
  const minYearsExperience = Number(request.minYearsExperience || 0);
  const minRating = Number(request.minimumRating || 0);
  const minCompletedServices = Number(request.minimumCompletedServices || 0);
  const requiresSstLicense = !!request.requiresSstLicense;
  const requiredAvailability = request.requiredAvailability || (request.requiresImmediateAvailability ? 'immediate' : 'this_week');

  const professionals = await User.find({
    role: 'professional_sst',
    isActive: true,
    'professionalProfile.availabilityStatus': 'available',
  })
    .select('email profile professionalProfile')
    .lean();

  // 1) Cobertura geográfica (prioridad máxima)
  const byCoverage = professionals.filter((pro) =>
    hasCoverageForCity(pro.professionalProfile, requestedCity, requestedCityText)
  );

  // 2) Tipo de profesional
  const byType = byCoverage.filter((pro) =>
    matchesProfessionalType(pro.professionalProfile, requiredType, requiredService)
  );

  // 3) Disponibilidad (ya viene forzada en query a available)

  // 4) Licencia SST (si se exige)
  const byLicense = requiresSstLicense
    ? byType.filter((pro) => hasValidSstLicense(pro.professionalProfile))
    : byType;

  // 5) Certificaciones requeridas
  const ids = byLicense.map((p) => p._id);
  const certifications = await ProfessionalCertification.find({ professional: { $in: ids } })
    .select('professional type expiresAt')
    .lean();

  const certMap = certifications.reduce((acc, cert) => {
    const key = cert.professional.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(cert);
    return acc;
  }, {});

  const byCertifications = byLicense.filter((pro) => {
    const certs = certMap[pro._id.toString()] || [];
    const hasHeights = certs.some((c) => c.type === 'coordinador_alturas' && isCertValid(c));
    const hasConfined = certs.some((c) => c.type === 'espacios_confinados' && isCertValid(c));
    if (request.requiresWorkingAtHeights && !hasHeights) return false;
    if (request.requiresConfinedSpaces && !hasConfined) return false;
    return true;
  });

  // 6) Experiencia
  const specialtyMatches = byCertifications.filter((pro) => {
    if (!requiredSpecialties.length) return false;
    const p = pro.professionalProfile || {};
    const specialties = (p.specialties || []).map(normalize);
    return requiredSpecialties.some((requested) =>
      specialties.some((have) => have.includes(requested) || requested.includes(have))
    );
  });

  const bySpecialty = requiredSpecialties.length > 0 ? specialtyMatches : byCertifications;

  const experienceMatches = bySpecialty.filter((pro) => {
    if (!minYearsExperience) return true;
    const years = Number(pro.professionalProfile?.yearsExperience || 0);
    return years >= minYearsExperience;
  });

  const byExperience = minYearsExperience > 0 ? experienceMatches : bySpecialty;

  // 7) Otros filtros opcionales
  const byOptionalFilters = byExperience.filter((pro) => {
    const p = pro.professionalProfile || {};
    if (requiredAvailability === 'immediate' || request.requiresImmediateAvailability) {
      if (!p.immediateAvailability) return false;
    }
    if (minRating > 0 && Number(p.ratingAvg || 0) < minRating) return false;
    if (minCompletedServices > 0 && Number(p.completedServicesCount || 0) < minCompletedServices) return false;
    return true;
  });

  return byOptionalFilters
    .map((pro) => {
      const p = pro.professionalProfile || {};
      const certs = certMap[pro._id.toString()] || [];
      const typeMatch = matchesProfessionalType(p, requiredType, requiredService);

      // Puntaje compuesto para priorizar coincidencia, sin eliminar candidatos utiles.
      let score = Number(p.ratingAvg || 0);
      if (requiredType && typeMatch) score += 2;
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
        geographicPriority: getGeographicPriority(p, requestedCity, requestedCityText),
        geographicMatch:
          p.geographicAvailability === 'nationwide' || p.canTravel
            ? 'nationwide'
            : (requestedCity && p.cityCode === requestedCity.cityCode) ||
                (requestedCity && (p.serviceMunicipalityCodes || []).includes(requestedCity.cityCode))
              ? 'city'
              : 'department',
        score,
      };
    })
    .sort((a, b) => {
      if (a.geographicPriority !== b.geographicPriority) {
        return a.geographicPriority - b.geographicPriority;
      }
      if (b.score !== a.score) return b.score - a.score;
      return (b.professionalProfile?.completedServicesCount || 0) -
        (a.professionalProfile?.completedServicesCount || 0);
    });
}
