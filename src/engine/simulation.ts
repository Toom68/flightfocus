import type { FlightPhase, PhaseConfig } from '@/types/flight';

export const PHASE_CONFIGS: PhaseConfig[] = [
  { phase: 'BOARDING', durationFraction: 0.00, altitudeStart: 0, altitudeEnd: 0, speedKnots: 0, progressStart: 0, progressEnd: 0 },
  { phase: 'TAXI', durationFraction: 0.03, altitudeStart: 0, altitudeEnd: 0, speedKnots: 20, progressStart: 0, progressEnd: 0.01 },
  { phase: 'TAKEOFF', durationFraction: 0.02, altitudeStart: 0, altitudeEnd: 5000, speedKnots: 160, progressStart: 0.01, progressEnd: 0.03 },
  { phase: 'CLIMB', durationFraction: 0.12, altitudeStart: 5000, altitudeEnd: 36000, speedKnots: 350, progressStart: 0.03, progressEnd: 0.15 },
  { phase: 'CRUISE', durationFraction: 0.60, altitudeStart: 36000, altitudeEnd: 36000, speedKnots: 480, progressStart: 0.15, progressEnd: 0.80 },
  { phase: 'DESCENT', durationFraction: 0.12, altitudeStart: 36000, altitudeEnd: 10000, speedKnots: 300, progressStart: 0.80, progressEnd: 0.92 },
  { phase: 'APPROACH', durationFraction: 0.07, altitudeStart: 10000, altitudeEnd: 2000, speedKnots: 180, progressStart: 0.92, progressEnd: 0.97 },
  { phase: 'LANDING', durationFraction: 0.02, altitudeStart: 2000, altitudeEnd: 0, speedKnots: 140, progressStart: 0.97, progressEnd: 0.99 },
  { phase: 'ARRIVED', durationFraction: 0.02, altitudeStart: 0, altitudeEnd: 0, speedKnots: 0, progressStart: 0.99, progressEnd: 1.0 },
];

export function getPhaseForProgress(progress: number): FlightPhase {
  for (let i = PHASE_CONFIGS.length - 1; i >= 0; i--) {
    if (progress >= PHASE_CONFIGS[i].progressStart) {
      return PHASE_CONFIGS[i].phase;
    }
  }
  return 'BOARDING';
}

export function getPhaseConfig(phase: FlightPhase): PhaseConfig {
  return PHASE_CONFIGS.find(c => c.phase === phase) || PHASE_CONFIGS[0];
}

export function getProgressForElapsedTime(
  elapsedSeconds: number,
  totalDuration: number,
  boardingDuration: number = 120
): number {
  if (elapsedSeconds <= boardingDuration) return 0;
  const flightElapsed = elapsedSeconds - boardingDuration;
  const flightDuration = totalDuration;
  return Math.min(1, flightElapsed / flightDuration);
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
