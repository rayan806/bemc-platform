const COLOMBIA_COUNTRY = { code: 'CO', name: 'Colombia' };

const CITY_CATALOG = [
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05001', cityName: 'Medellin' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05002', cityName: 'Abejorral' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05004', cityName: 'Abriaqui' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05079', cityName: 'Barbosa' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05148', cityName: 'Envigado' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05360', cityName: 'Itagui' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05380', cityName: 'La Estrella' },
  { departmentCode: '05', departmentName: 'Antioquia', cityCode: '05615', cityName: 'Rionegro' },
  { departmentCode: '08', departmentName: 'Atlantico', cityCode: '08001', cityName: 'Barranquilla' },
  { departmentCode: '08', departmentName: 'Atlantico', cityCode: '08573', cityName: 'Puerto Colombia' },
  { departmentCode: '11', departmentName: 'Bogota D.C.', cityCode: '11001', cityName: 'Bogota D.C.' },
  { departmentCode: '11', departmentName: 'Bogota D.C.', cityCode: '11001-TJ', cityName: 'Tunjuelito' },
  { departmentCode: '13', departmentName: 'Bolivar', cityCode: '13001', cityName: 'Cartagena' },
  { departmentCode: '15', departmentName: 'Boyaca', cityCode: '15001', cityName: 'Tunja' },
  { departmentCode: '15', departmentName: 'Boyaca', cityCode: '15238', cityName: 'Duitama' },
  { departmentCode: '15', departmentName: 'Boyaca', cityCode: '15407', cityName: 'Villa de Leyva' },
  { departmentCode: '17', departmentName: 'Caldas', cityCode: '17001', cityName: 'Manizales' },
  { departmentCode: '18', departmentName: 'Caqueta', cityCode: '18001', cityName: 'Florencia' },
  { departmentCode: '19', departmentName: 'Cauca', cityCode: '19001', cityName: 'Popayan' },
  { departmentCode: '20', departmentName: 'Cesar', cityCode: '20001', cityName: 'Valledupar' },
  { departmentCode: '23', departmentName: 'Cordoba', cityCode: '23001', cityName: 'Monteria' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25001', cityName: 'Agua de Dios' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25019', cityName: 'Alban' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25245', cityName: 'El Colegio' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25286', cityName: 'Funza' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25307', cityName: 'Girardot' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25430', cityName: 'Madrid' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25473', cityName: 'Mosquera' },
  { departmentCode: '25', departmentName: 'Cundinamarca', cityCode: '25754', cityName: 'Soacha' },
  { departmentCode: '27', departmentName: 'Choco', cityCode: '27001', cityName: 'Quibdo' },
  { departmentCode: '41', departmentName: 'Huila', cityCode: '41001', cityName: 'Neiva' },
  { departmentCode: '44', departmentName: 'La Guajira', cityCode: '44001', cityName: 'Riohacha' },
  { departmentCode: '47', departmentName: 'Magdalena', cityCode: '47001', cityName: 'Santa Marta' },
  { departmentCode: '50', departmentName: 'Meta', cityCode: '50001', cityName: 'Villavicencio' },
  { departmentCode: '52', departmentName: 'Narino', cityCode: '52001', cityName: 'Pasto' },
  { departmentCode: '54', departmentName: 'Norte de Santander', cityCode: '54001', cityName: 'Cucuta' },
  { departmentCode: '63', departmentName: 'Quindio', cityCode: '63001', cityName: 'Armenia' },
  { departmentCode: '66', departmentName: 'Risaralda', cityCode: '66001', cityName: 'Pereira' },
  { departmentCode: '68', departmentName: 'Santander', cityCode: '68001', cityName: 'Bucaramanga' },
  { departmentCode: '68', departmentName: 'Santander', cityCode: '68077', cityName: 'Barbosa' },
  { departmentCode: '70', departmentName: 'Sucre', cityCode: '70001', cityName: 'Sincelejo' },
  { departmentCode: '73', departmentName: 'Tolima', cityCode: '73001', cityName: 'Ibague' },
  { departmentCode: '76', departmentName: 'Valle del Cauca', cityCode: '76001', cityName: 'Cali' },
  { departmentCode: '76', departmentName: 'Valle del Cauca', cityCode: '76109', cityName: 'Buenaventura' },
  { departmentCode: '76', departmentName: 'Valle del Cauca', cityCode: '76400', cityName: 'La Union' },
  { departmentCode: '81', departmentName: 'Arauca', cityCode: '81001', cityName: 'Arauca' },
  { departmentCode: '85', departmentName: 'Casanare', cityCode: '85001', cityName: 'Yopal' },
  { departmentCode: '86', departmentName: 'Putumayo', cityCode: '86001', cityName: 'Mocoa' },
  { departmentCode: '88', departmentName: 'San Andres y Providencia', cityCode: '88001', cityName: 'San Andres' },
  { departmentCode: '91', departmentName: 'Amazonas', cityCode: '91001', cityName: 'Leticia' },
  { departmentCode: '94', departmentName: 'Guainia', cityCode: '94001', cityName: 'Inirida' },
  { departmentCode: '95', departmentName: 'Guaviare', cityCode: '95001', cityName: 'San Jose del Guaviare' },
  { departmentCode: '97', departmentName: 'Vaupes', cityCode: '97001', cityName: 'Mitu' },
  { departmentCode: '99', departmentName: 'Vichada', cityCode: '99001', cityName: 'Puerto Carreno' },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CITY_INDEX = CITY_CATALOG.map((item) => ({
  ...item,
  countryCode: COLOMBIA_COUNTRY.code,
  countryName: COLOMBIA_COUNTRY.name,
  displayName: `${item.cityName}, ${item.departmentName}`,
  searchText: normalizeText(`${item.cityName} ${item.departmentName}`),
}));

const DEPARTMENT_INDEX = Array.from(
  CITY_INDEX.reduce((acc, item) => {
    if (!acc.has(item.departmentCode)) {
      acc.set(item.departmentCode, {
        countryCode: COLOMBIA_COUNTRY.code,
        countryName: COLOMBIA_COUNTRY.name,
        departmentCode: item.departmentCode,
        departmentName: item.departmentName,
        displayName: item.departmentName,
        searchText: normalizeText(item.departmentName),
      });
    }
    return acc;
  }, new Map()).values()
);

function mapCity(item) {
  return {
    countryCode: item.countryCode,
    countryName: item.countryName,
    departmentCode: item.departmentCode,
    departmentName: item.departmentName,
    cityCode: item.cityCode,
    cityName: item.cityName,
    displayName: item.displayName,
  };
}

function mapDepartment(item) {
  return {
    countryCode: item.countryCode,
    countryName: item.countryName,
    departmentCode: item.departmentCode,
    departmentName: item.departmentName,
    displayName: item.displayName,
  };
}

export function searchLocations({ query = '', type = 'city', departmentCode, limit = 12 } = {}) {
  const normalizedQuery = normalizeText(query);
  const max = Math.max(1, Math.min(Number(limit) || 12, 30));

  if (type === 'department') {
    const list = DEPARTMENT_INDEX.filter((item) => {
      if (!normalizedQuery) return true;
      return item.searchText.includes(normalizedQuery);
    })
      .slice(0, max)
      .map(mapDepartment);
    return list;
  }

  const list = CITY_INDEX.filter((item) => {
    if (departmentCode && item.departmentCode !== String(departmentCode)) return false;
    if (!normalizedQuery) return true;
    return item.searchText.includes(normalizedQuery);
  })
    .slice(0, max)
    .map(mapCity);

  return list;
}

export function findCityByCode(cityCode) {
  if (!cityCode) return null;
  const match = CITY_INDEX.find((item) => item.cityCode === String(cityCode));
  return match ? mapCity(match) : null;
}

export function findDepartmentByCode(departmentCode) {
  if (!departmentCode) return null;
  const match = DEPARTMENT_INDEX.find((item) => item.departmentCode === String(departmentCode));
  return match ? mapDepartment(match) : null;
}

export function resolveCitySelection(value) {
  if (!value) return null;

  if (typeof value === 'object' && value.cityCode) {
    return findCityByCode(value.cityCode);
  }

  const text = normalizeText(value.cityName || value.displayName || value.city || value);
  if (!text) return null;

  const exactMatches = CITY_INDEX.filter((item) => normalizeText(item.cityName) === text || normalizeText(item.displayName) === text);
  if (exactMatches.length !== 1) return null;
  return mapCity(exactMatches[0]);
}

export function resolveDepartmentSelection(value) {
  if (!value) return null;

  if (typeof value === 'object' && value.departmentCode) {
    return findDepartmentByCode(value.departmentCode);
  }

  const text = normalizeText(value.departmentName || value.displayName || value.department || value);
  if (!text) return null;

  const exactMatches = DEPARTMENT_INDEX.filter((item) => normalizeText(item.departmentName) === text || normalizeText(item.displayName) === text);
  if (exactMatches.length !== 1) return null;
  return mapDepartment(exactMatches[0]);
}

export function resolveCitySelections(values = []) {
  const unique = new Map();
  for (const value of values || []) {
    const resolved = resolveCitySelection(value);
    if (resolved) unique.set(resolved.cityCode, resolved);
  }
  return Array.from(unique.values());
}

export function resolveDepartmentSelections(values = []) {
  const unique = new Map();
  for (const value of values || []) {
    const resolved = resolveDepartmentSelection(value);
    if (resolved) unique.set(resolved.departmentCode, resolved);
  }
  return Array.from(unique.values());
}

export function isSameLocation(cityA, cityB) {
  if (!cityA || !cityB) return false;
  if (cityA.cityCode && cityB.cityCode) return cityA.cityCode === cityB.cityCode;
  return normalizeText(cityA.cityName || cityA.city) === normalizeText(cityB.cityName || cityB.city);
}

export function normalizeLocationText(value) {
  return normalizeText(value);
}
