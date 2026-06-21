import type { Airport } from './airport';

export interface VisitedAirport {
  iata: string;
  airport: Airport;
  arrivedAt: number;          // timestamp (ms)
  departedFrom: string;       // IATA of where this leg started
  ambientMinutesDuring: number; // real minutes the sim ran on the leg that brought you here
  distanceKm: number;         // distance of the leg that brought you here
  crossedEquator?: boolean;   // the leg flipped hemispheres
  crossedDateline?: boolean;  // the leg crossed the international date line
  departedLocalHour?: number; // local hour (0-23) at the departure airport when the leg began
  cruiseMinutes?: number;     // real minutes spent at CRUISE phase during the leg
}

export interface JournalEntry {
  id: string;
  fromAirport: Airport;
  toAirport: Airport;
  text: string;               // AI-generated (or template fallback) diary entry about time in `fromAirport`
  svgKey: string;             // lookup key into citySketchData (usually fromAirport.iata)
  createdAt: number;
  ambientMinutesDuring: number;
  isGenerating?: boolean;     // true while the LLM call is in-flight
  isFallback?: boolean;       // true if generated from the local template (no API)
}

export interface SaveStats {
  totalFlights: number;
  totalAmbientMinutes: number; // real wall-clock minutes the sim ran across all legs
  totalDistanceKm: number;
  longestFlightKm: number;
  shortestFlightKm: number;
  maxCruiseMinutesInLeg: number;
}

export interface SaveGame {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  originIata: string;            // the very first airport (for "Homecoming")
  currentAirport: Airport;       // where you currently are (= last arrival)
  visitedAirports: VisitedAirport[];
  journalEntries: JournalEntry[];
  unlockedAchievements: string[];
  achievementUnlockedAt: Record<string, number>;
  stats: SaveStats;
}

export function createEmptySaveStats(): SaveStats {
  return {
    totalFlights: 0,
    totalAmbientMinutes: 0,
    totalDistanceKm: 0,
    longestFlightKm: 0,
    shortestFlightKm: Infinity,
    maxCruiseMinutesInLeg: 0,
  };
}
