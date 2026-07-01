import { Service } from '../models/Service.js';

const defaultServices = [
  {
    name: 'Implementación SG-SST',
    category: 'sg-sst',
    shortDescription: 'Sistema de Gestión de Seguridad y Salud en el Trabajo',
    description:
      'Diseño e implementación del Sistema de Gestión SST conforme a la normativa colombiana. Incluye diagnóstico, plan de trabajo y documentación.',
    price: 3500000,
    duration: '3-6 meses',
    requiredDocuments: ['RUT', 'Cámara de comercio', 'Listado de trabajadores'],
    sortOrder: 1,
  },
  {
    name: 'Auditoría SST',
    category: 'auditoria',
    shortDescription: 'Evaluación del cumplimiento normativo SST',
    description:
      'Auditoría integral del sistema SST con informe de hallazgos, plan de mejora y seguimiento.',
    price: 1800000,
    duration: '2-4 semanas',
    requiredDocuments: ['Documentación SG-SST vigente'],
    sortOrder: 2,
  },
  {
    name: 'Capacitación SST',
    category: 'capacitacion',
    shortDescription: 'Formación en seguridad y salud en el trabajo',
    description:
      'Capacitaciones presenciales o virtuales: brigadas, trabajo en alturas, espacios confinados y más.',
    price: 450000,
    duration: 'Por sesión',
    requiredDocuments: ['Listado de asistentes'],
    sortOrder: 3,
  },
  {
    name: 'Inspección de Seguridad',
    category: 'inspeccion',
    shortDescription: 'Inspecciones técnicas en sitio',
    description:
      'Inspección de instalaciones, equipos y condiciones de trabajo con acta e informe fotográfico.',
    price: 800000,
    duration: '1-3 días',
    requiredDocuments: ['Plano o descripción del sitio'],
    sortOrder: 4,
  },
  {
    name: 'Evaluación de Riesgos',
    category: 'evaluacion-riesgo',
    shortDescription: 'Identificación y valoración de riesgos laborales',
    description:
      'Metodología GTC 45 o equivalente. Matriz de riesgos y medidas de control.',
    price: 1200000,
    duration: '2-3 semanas',
    requiredDocuments: ['Inventario de procesos y cargos'],
    sortOrder: 5,
  },
  {
    name: 'Consultoría Empresarial SST',
    category: 'consultoria',
    shortDescription: 'Acompañamiento experto continuo',
    description:
      'Consultoría personalizada para empresas que requieren soporte SST permanente o por proyecto.',
    price: 2500000,
    duration: 'Según contrato',
    requiredDocuments: ['Brief de necesidades'],
    sortOrder: 6,
  },
];

export async function seedServicesIfEmpty() {
  const count = await Service.countDocuments();
  if (count > 0) return;

  for (const data of defaultServices) {
    await Service.create(data);
  }
  console.log('Servicios SST iniciales creados');
}
