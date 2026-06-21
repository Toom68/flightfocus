import type { SaveGame, VisitedAirport } from '@/types/savegame';
import { getContinent, type Continent } from '@/utils/geo';

export type AchievementCategory = 'geographic' | 'ambient' | 'hidden';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  category: AchievementCategory;
  hidden?: boolean;
  check: (ctx: AchievementContext) => boolean;
}

// Pre-computed values derived from a save, shared across all checks.
export interface AchievementContext {
  save: SaveGame;
  uniqueIataCount: number;
  visitedContinents: Set<Continent>;
  perContinentCounts: Record<string, number>;
  longitudeBands: Set<number>; // 12 bands of 30deg covering the globe
  duplicateLanding: boolean;
  returnedHome: boolean;
  anyEquatorCross: boolean;
  anyDatelineCross: boolean;
  anyRedEye: boolean;
}

export function buildAchievementContext(save: SaveGame): AchievementContext {
  const visited = save.visitedAirports;
  const iataCounts = new Map<string, number>();
  const visitedContinents = new Set<Continent>();
  const perContinentCounts: Record<string, number> = {};
  const longitudeBands = new Set<number>();
  const seenForContinent = new Set<string>();

  for (const v of visited) {
    iataCounts.set(v.iata, (iataCounts.get(v.iata) ?? 0) + 1);
    const cont = getContinent(v.airport);
    visitedContinents.add(cont);
    // count unique airports per continent
    if (!seenForContinent.has(v.iata)) {
      seenForContinent.add(v.iata);
      perContinentCounts[cont] = (perContinentCounts[cont] ?? 0) + 1;
    }
    const band = Math.floor(((v.airport.lng + 180) % 360) / 30);
    longitudeBands.add(band);
  }

  const uniqueIataCount = iataCounts.size;
  const duplicateLanding = [...iataCounts.values()].some((c) => c >= 2);
  // origin appears at least twice (started there and returned)
  const returnedHome = (iataCounts.get(save.originIata) ?? 0) >= 2;
  const anyEquatorCross = visited.some((v) => v.crossedEquator);
  const anyDatelineCross = visited.some((v) => v.crossedDateline);
  const anyRedEye = visited.some(
    (v) => typeof v.departedLocalHour === 'number' && (v.departedLocalHour >= 22 || v.departedLocalHour < 5)
  );

  return {
    save,
    uniqueIataCount,
    visitedContinents,
    perContinentCounts,
    longitudeBands,
    duplicateLanding,
    returnedHome,
    anyEquatorCross,
    anyDatelineCross,
    anyRedEye,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // ---- Geographic ----
  {
    id: 'first_flight',
    name: 'Wheels Up',
    description: 'Complete your first flight.',
    icon: 'PlaneTakeoff',
    category: 'geographic',
    check: (c) => c.save.stats.totalFlights >= 1,
  },
  {
    id: 'airports_5',
    name: 'Globetrotter',
    description: 'Visit 5 different airports.',
    icon: 'Globe',
    category: 'geographic',
    check: (c) => c.uniqueIataCount >= 5,
  },
  {
    id: 'airports_10',
    name: 'Frequent Flyer',
    description: 'Visit 10 different airports.',
    icon: 'Globe2',
    category: 'geographic',
    check: (c) => c.uniqueIataCount >= 10,
  },
  {
    id: 'airports_25',
    name: 'World Wanderer',
    description: 'Visit 25 different airports.',
    icon: 'Map',
    category: 'geographic',
    check: (c) => c.uniqueIataCount >= 25,
  },
  {
    id: 'airports_50',
    name: 'Atlas',
    description: 'Visit 50 different airports.',
    icon: 'Compass',
    category: 'geographic',
    check: (c) => c.uniqueIataCount >= 50,
  },
  {
    id: 'continent_eu',
    name: 'Old World',
    description: 'Land somewhere in Europe.',
    icon: 'Landmark',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('Europe'),
  },
  {
    id: 'continent_as',
    name: 'Eastern Skies',
    description: 'Land somewhere in Asia.',
    icon: 'Sunrise',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('Asia'),
  },
  {
    id: 'continent_na',
    name: 'New World',
    description: 'Land somewhere in North America.',
    icon: 'Building2',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('North America'),
  },
  {
    id: 'continent_sa',
    name: 'Amazonia',
    description: 'Land somewhere in South America.',
    icon: 'Leaf',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('South America'),
  },
  {
    id: 'continent_af',
    name: 'Sahara Sun',
    description: 'Land somewhere in Africa.',
    icon: 'Sun',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('Africa'),
  },
  {
    id: 'continent_oc',
    name: 'Down Under',
    description: 'Land somewhere in Oceania.',
    icon: 'Waves',
    category: 'geographic',
    check: (c) => c.visitedContinents.has('Oceania'),
  },
  {
    id: 'all_continents',
    name: 'Circumnavigator',
    description: 'Set foot on all six inhabited continents.',
    icon: 'Globe',
    category: 'geographic',
    check: (c) => c.visitedContinents.size >= 6,
  },
  {
    id: 'equator',
    name: 'Zero Latitude',
    description: 'Cross the equator on a single flight.',
    icon: 'Minus',
    category: 'geographic',
    check: (c) => c.anyEquatorCross,
  },
  {
    id: 'dateline',
    name: 'Time Traveller',
    description: 'Cross the international date line.',
    icon: 'Clock',
    category: 'geographic',
    check: (c) => c.anyDatelineCross,
  },
  {
    id: 'long_haul',
    name: 'Marathon Flight',
    description: 'Fly more than 10,000 km in a single leg.',
    icon: 'Ruler',
    category: 'geographic',
    check: (c) => c.save.stats.longestFlightKm > 10000,
  },
  {
    id: 'short_hop',
    name: 'Island Hopper',
    description: 'Fly a leg shorter than 500 km.',
    icon: 'MoveRight',
    category: 'geographic',
    check: (c) => c.save.stats.totalFlights > 0 && c.save.stats.shortestFlightKm < 500,
  },

  // ---- Ambient session ----
  {
    id: 'ambient_1h',
    name: 'Above the Clouds',
    description: 'Spend 1 real hour with the simulation running.',
    icon: 'Cloud',
    category: 'ambient',
    check: (c) => c.save.stats.totalAmbientMinutes >= 60,
  },
  {
    id: 'ambient_8h',
    name: 'Full Work Day',
    description: 'Accumulate 8 real hours in the air.',
    icon: 'Briefcase',
    category: 'ambient',
    check: (c) => c.save.stats.totalAmbientMinutes >= 480,
  },
  {
    id: 'ambient_50h',
    name: 'The Commuter',
    description: 'Accumulate 50 real hours in the air.',
    icon: 'Headphones',
    category: 'ambient',
    check: (c) => c.save.stats.totalAmbientMinutes >= 3000,
  },
  {
    id: 'ambient_200h',
    name: 'Frequent Flyer Soul',
    description: 'Accumulate 200 real hours in the air.',
    icon: 'Infinity',
    category: 'ambient',
    check: (c) => c.save.stats.totalAmbientMinutes >= 12000,
  },
  {
    id: 'cruise_work',
    name: 'Cruising Altitude',
    description: 'Spend 30+ real minutes at cruise during one flight.',
    icon: 'Plane',
    category: 'ambient',
    check: (c) => c.save.stats.maxCruiseMinutesInLeg >= 30,
  },

  // ---- Hidden ----
  {
    id: 'return_home',
    name: 'Homecoming',
    description: 'Return to the airport where your journey began.',
    icon: 'Home',
    category: 'hidden',
    hidden: true,
    check: (c) => c.returnedHome,
  },
  {
    id: 'same_city_twice',
    name: 'Return Trip',
    description: 'Land at the same airport twice.',
    icon: 'Repeat',
    category: 'hidden',
    hidden: true,
    check: (c) => c.duplicateLanding,
  },
  {
    id: 'red_eye',
    name: 'Night Owl',
    description: 'Depart on a red-eye (after 22:00 local time).',
    icon: 'Moon',
    category: 'hidden',
    hidden: true,
    check: (c) => c.anyRedEye,
  },
  {
    id: 'full_circle',
    name: 'Around the World',
    description: 'Visit airports spanning every longitude of the globe.',
    icon: 'Globe',
    category: 'hidden',
    hidden: true,
    check: (c) => c.longitudeBands.size >= 12,
  },
  {
    id: 'solo_continent',
    name: 'Lone Continent',
    description: 'Visit 5 airports within a single continent.',
    icon: 'MapPin',
    category: 'hidden',
    hidden: true,
    check: (c) => Object.values(c.perContinentCounts).some((n) => n >= 5),
  },
];

export const ACHIEVEMENTS_BY_ID: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

/**
 * Returns the list of achievement ids that are newly satisfied by `save`
 * but not yet present in `save.unlockedAchievements`.
 */
export function evaluateNewAchievements(save: SaveGame): string[] {
  const ctx = buildAchievementContext(save);
  const already = new Set(save.unlockedAchievements);
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!already.has(a.id) && a.check(ctx)) {
      newly.push(a.id);
    }
  }
  return newly;
}

// Helpers used when recording a leg.
export function legCrossesEquator(fromLat: number, toLat: number): boolean {
  return (fromLat >= 0 && toLat < 0) || (fromLat < 0 && toLat >= 0);
}

export function legCrossesDateline(fromLng: number, toLng: number): boolean {
  return Math.abs(fromLng - toLng) > 180;
}

export function summarizeLegForAchievements(_v: VisitedAirport): void {
  // reserved for future per-leg achievement hooks
}
