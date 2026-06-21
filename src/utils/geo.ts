import type { Airport } from '@/types/airport';

export type Continent =
  | 'North America'
  | 'South America'
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'Oceania';

// Country -> continent map covering every country in the airport dataset.
const COUNTRY_CONTINENT: Record<string, Continent> = {
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'United Kingdom': 'Europe',
  'France': 'Europe',
  'Netherlands': 'Europe',
  'Germany': 'Europe',
  'Spain': 'Europe',
  'Italy': 'Europe',
  'Switzerland': 'Europe',
  'Portugal': 'Europe',
  'Ireland': 'Europe',
  'Austria': 'Europe',
  'Norway': 'Europe',
  'Sweden': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Greece': 'Europe',
  'Russia': 'Europe',
  'Turkey': 'Asia',
  'China': 'Asia',
  'Japan': 'Asia',
  'Singapore': 'Asia',
  'South Korea': 'Asia',
  'Qatar': 'Asia',
  'Thailand': 'Asia',
  'Malaysia': 'Asia',
  'India': 'Asia',
  'United Arab Emirates': 'Asia',
  'Saudi Arabia': 'Asia',
  'Taiwan': 'Asia',
  'Philippines': 'Asia',
  'Indonesia': 'Asia',
  'Sri Lanka': 'Asia',
  'Bangladesh': 'Asia',
  'Nepal': 'Asia',
  'Vietnam': 'Asia',
  'Myanmar': 'Asia',
  'Cambodia': 'Asia',
  'South Africa': 'Africa',
  'Egypt': 'Africa',
  'Kenya': 'Africa',
  'Ethiopia': 'Africa',
  'Nigeria': 'Africa',
  'Morocco': 'Africa',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
};

// Coordinate-based fallback for any country not explicitly mapped.
function continentFromCoords(lat: number, lng: number): Continent {
  if (lat > 12 && lng > -30 && lng < 45 && lat < 72) return 'Europe';
  if (lat <= 12 && lat > -38 && lng > -20 && lng < 52) return 'Africa';
  if (lng >= 45 && lng <= 180 && lat > -12) return 'Asia';
  if (lat <= -10 && lng >= 110) return 'Oceania';
  if (lng < -30 && lat < 13) return 'South America';
  return 'North America';
}

export function getContinent(airport: Airport): Continent {
  return COUNTRY_CONTINENT[airport.country] ?? continentFromCoords(airport.lat, airport.lng);
}

export const ALL_CONTINENTS: Continent[] = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania',
];

// Maps a continent to the achievement id used in achievements.ts
export const CONTINENT_ACHIEVEMENT: Record<Continent, string> = {
  'Europe': 'continent_eu',
  'Asia': 'continent_as',
  'Oceania': 'continent_oc',
  'Africa': 'continent_af',
  'South America': 'continent_sa',
  'North America': 'continent_na',
};

/**
 * Convert lat/lng to x/y in an equirectangular projection.
 * Returns fractions 0..1 (x = left->right, y = top->bottom).
 */
export function project(lat: number, lng: number): { x: number; y: number } {
  const x = (lng + 180) / 360;
  const y = (90 - lat) / 180;
  return { x, y };
}
