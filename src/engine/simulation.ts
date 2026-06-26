import type { FlightPhase, PhaseConfig } from '@/types/flight';

/**
 * Ground sequence: fixed REAL-TIME (unscaled) durations that play out at the
 * departure airport before the flight clock starts. The aircraft does not move
 * geographically during these phases — `progress` stays at 0 until takeoff
 * completes (this fixes the old "81 km on the runway" bug where ground phases
 * consumed a fraction of the great-circle route).
 */
export const GROUND_DURATIONS: Record<'BOARDING' | 'TAXI' | 'TAKEOFF', number> = {
  BOARDING: 25,
  TAXI: 30,
  TAKEOFF: 15,
};

export const GROUND_TOTAL_SECONDS =
  GROUND_DURATIONS.BOARDING + GROUND_DURATIONS.TAXI + GROUND_DURATIONS.TAKEOFF;

/** Notional in-world time the ground ritual represents (for the day/night clock). */
export const GROUND_WORLD_SECONDS = 1800; // 30 min

/**
 * Airborne phases keyed off airborne progress (0 = start of climb at takeoff
 * completion, 1 = arrival). Ground phases are NOT in this table — they're driven
 * by the real-time ground clock in the flight store.
 */
// Based on a realistic 150-minute flight profile:
// Takeoff 0-5min (0-3.3%), Enroute Climb 5-30min (3.3-20%),
// Cruise 30-120min (20-80%), Descent 120-145min (80-96.7%),
// Approach & Landing 145-150min (96.7-100%)
export const PHASE_CONFIGS: PhaseConfig[] = [
  { phase: 'CLIMB', durationFraction: 0.20, altitudeStart: 0, altitudeEnd: 36000, speedKnots: 300, progressStart: 0.00, progressEnd: 0.20 },
  { phase: 'CRUISE', durationFraction: 0.60, altitudeStart: 36000, altitudeEnd: 36000, speedKnots: 300, progressStart: 0.20, progressEnd: 0.80 },
  { phase: 'DESCENT', durationFraction: 0.167, altitudeStart: 36000, altitudeEnd: 10000, speedKnots: 250, progressStart: 0.80, progressEnd: 0.967 },
  { phase: 'APPROACH', durationFraction: 0.022, altitudeStart: 10000, altitudeEnd: 2000, speedKnots: 180, progressStart: 0.967, progressEnd: 0.989 },
  { phase: 'LANDING', durationFraction: 0.011, altitudeStart: 2000, altitudeEnd: 0, speedKnots: 140, progressStart: 0.989, progressEnd: 1.0 },
];

/** Resolve the current ground phase from elapsed real seconds, or null once airborne. */
export function getGroundPhase(groundElapsedSeconds: number): FlightPhase | null {
  if (groundElapsedSeconds < GROUND_DURATIONS.BOARDING) return 'BOARDING';
  if (groundElapsedSeconds < GROUND_DURATIONS.BOARDING + GROUND_DURATIONS.TAXI) return 'TAXI';
  if (groundElapsedSeconds < GROUND_TOTAL_SECONDS) return 'TAKEOFF';
  return null;
}

/** Ground speed (knots) ramp across taxi/takeoff for display. */
export function getGroundSpeed(groundElapsedSeconds: number): number {
  const phase = getGroundPhase(groundElapsedSeconds);
  if (phase === 'BOARDING') return 0;
  if (phase === 'TAXI') return 20;
  if (phase === 'TAKEOFF') {
    // accelerate from 20 -> ~160 kts across the takeoff roll
    const takeoffStart = GROUND_DURATIONS.BOARDING + GROUND_DURATIONS.TAXI;
    const f = Math.min(1, (groundElapsedSeconds - takeoffStart) / GROUND_DURATIONS.TAKEOFF);
    return 20 + f * 140;
  }
  return 0;
}

/** Airborne phase for the given airborne progress (0..1). */
export function getPhaseForProgress(progress: number): FlightPhase {
  if (progress >= 1) return 'ARRIVED';
  for (let i = PHASE_CONFIGS.length - 1; i >= 0; i--) {
    if (progress >= PHASE_CONFIGS[i].progressStart) {
      return PHASE_CONFIGS[i].phase;
    }
  }
  return 'CLIMB';
}

export function getPhaseConfig(phase: FlightPhase): PhaseConfig {
  return PHASE_CONFIGS.find(c => c.phase === phase) || PHASE_CONFIGS[0];
}

export function getPhaseDescription(phase: FlightPhase): string {
  switch (phase) {
    case 'BOARDING': return 'Passengers boarding';
    case 'TAXI': return 'Taxiing to runway';
    case 'TAKEOFF': return 'Takeoff';
    case 'CLIMB': return 'Climbing to cruise altitude';
    case 'CRUISE': return 'Cruising';
    case 'DESCENT': return 'Beginning descent';
    case 'APPROACH': return 'On approach';
    case 'LANDING': return 'Landing';
    case 'ARRIVED': return 'Arrived at destination';
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDistance(km: number): string {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(0)}k km`;
  }
  return `${Math.round(km)} km`;
}
