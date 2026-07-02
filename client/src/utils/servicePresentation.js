/**
 * Archivo: client/src/utils/servicePresentation.js
 * Proposito: Mapeos de presentacion visual para servicios.
 */

export const categoryLabels = {
  'sg-sst': 'SG-SST',
  auditoria: 'Auditoria',
  capacitacion: 'Capacitacion',
  inspeccion: 'Inspeccion',
  'evaluacion-riesgo': 'Evaluacion de riesgos',
  consultoria: 'Consultoria',
  otro: 'Servicio SST',
};

export const serviceVisuals = {
  'sg-sst': { icon: 'bi-clipboard2-check', tone: 'sg' },
  auditoria: { icon: 'bi-search-heart', tone: 'audit' },
  capacitacion: { icon: 'bi-easel2', tone: 'training' },
  inspeccion: { icon: 'bi-cone-striped', tone: 'inspection' },
  'evaluacion-riesgo': { icon: 'bi-diagram-3', tone: 'risk' },
  consultoria: { icon: 'bi-person-workspace', tone: 'consulting' },
  otro: { icon: 'bi-shield-check', tone: 'default' },
};

export function getServicePresentation(service) {
  return serviceVisuals[service?.category] || serviceVisuals.otro;
}
