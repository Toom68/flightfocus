import { create } from 'zustand';
import type { Airport } from '@/types/airport';
import type { FlightPhase, FlightRoute, FlightPosition } from '@/types/flight';
import type { ViewMode } from '@/types/simulation';
import { generateFlightRoute, getPositionAtProgress } from '@/engine/route';
import {
  getPhaseForProgress,
  getGroundPhase,
  getGroundSpeed,
  GROUND_TOTAL_SECONDS,
  GROUND_WORLD_SECONDS,
} from '@/engine/simulation';
import { getAltitudeForProgress, getSpeedForProgress } from '@/engine/navigation';
import { getTimezoneOffsetMs, getLocalHourInTimezone } from '@/utils/time';

type TimeMode = 'realtime' | 'custom';

const PERSIST_KEY = 'flyandwork-inflight';
const PERSIST_INTERVAL_MS = 2000;

interface PersistedFlight {
  departure: Airport;
  arrival: Airport;
  route: FlightRoute;
  phase: FlightPhase;
  position: FlightPosition;
  progress: number;
  elapsedTime: number;
  isActive: boolean;
  isPaused: boolean;
  timeScale: number;
  viewMode: ViewMode;
  groundElapsed: number;
  timeMode: TimeMode;
  departureTimeUTC: number;
  customHour: number;
  simulationDateMs: number;
  sessionRealSeconds: number;
  cruiseRealSeconds: number;
  departedLocalHour: number | null;
  arrivalProcessed: boolean;
  savedAt: number;
}

function savePersistedFlight(data: PersistedFlight) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function loadPersistedFlight(): PersistedFlight | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedFlight;
  } catch {
    return null;
  }
}

function clearPersistedFlight() {
  try {
    localStorage.removeItem(PERSIST_KEY);
  } catch {
    // ignore
  }
}

export function hasPersistedFlight(): boolean {
  return loadPersistedFlight() !== null;
}

export function getPersistedFlightInfo(): { fromCity: string; toCity: string; phase: string; savedAt: number } | null {
  const p = loadPersistedFlight();
  if (!p) return null;
  return {
    fromCity: p.departure.city,
    toCity: p.arrival.city,
    phase: p.phase,
    savedAt: p.savedAt,
  };
}

interface FlightStore {
  departure: Airport | null;
  arrival: Airport | null;
  route: FlightRoute | null;
  phase: FlightPhase;
  position: FlightPosition;
  progress: number;
  elapsedTime: number;
  isActive: boolean;
  isPaused: boolean;
  timeScale: number;
  viewMode: ViewMode;
  groundElapsed: number;        // real (unscaled) seconds elapsed in the ground sequence
  timeMode: TimeMode;
  departureTimeUTC: number;
  customHour: number;
  simulationDate: Date;
  sessionRealSeconds: number;   // real wall-clock seconds the sim has run this leg (unscaled)
  cruiseRealSeconds: number;    // real wall-clock seconds spent at CRUISE this leg
  departedLocalHour: number | null; // local hour at departure airport when the leg began
  arrivalProcessed: boolean;    // guards once-only arrival recording (StrictMode-safe)

  setDeparture: (airport: Airport | null) => void;
  setArrival: (airport: Airport | null) => void;
  startFlight: () => void;
  pauseFlight: () => void;
  resumeFlight: () => void;
  stopFlight: () => void;
  returnToGrounded: () => void;
  markArrivalProcessed: () => void;
  setTimeScale: (scale: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimeMode: (mode: TimeMode) => void;
  setCustomHour: (hour: number) => void;
  tick: (deltaSeconds: number) => void;
  restorePersistedFlight: () => boolean;
  discardPersistedFlight: () => void;
}

export const useFlightStore = create<FlightStore>((set, get) => ({
  departure: null,
  arrival: null,
  route: null,
  phase: 'BOARDING',
  position: { lat: 0, lng: 0, altitude: 0, speed: 0, heading: 0, progress: 0, distanceRemaining: 0, timeRemaining: 0 },
  progress: 0,
  elapsedTime: 0,
  isActive: false,
  isPaused: false,
  timeScale: 1,
  viewMode: 'home',
  groundElapsed: 0,
  timeMode: 'realtime',
  departureTimeUTC: Date.now(),
  customHour: 10,
  simulationDate: new Date(),
  sessionRealSeconds: 0,
  cruiseRealSeconds: 0,
  departedLocalHour: null,
  arrivalProcessed: false,
  _lastPersistMs: 0,

  setDeparture: (airport) => set({ departure: airport }),
  setArrival: (airport) => set({ arrival: airport }),

  startFlight: () => {
    const { departure, arrival, timeMode, customHour } = get();
    if (!departure || !arrival) return;

    const route = generateFlightRoute(departure, arrival);

    // Calculate departure time in UTC
    let departureUTC: number;
    if (timeMode === 'realtime') {
      departureUTC = Date.now();
    } else {
      // Custom time: interpret customHour as local time at departure airport
      // Use the departure timezone to convert to UTC
      const now = new Date();
      const depLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), customHour, 0, 0);
      // Get UTC offset for the departure timezone
      const depTzOffset = getTimezoneOffsetMs(departure.timezone, depLocal);
      departureUTC = depLocal.getTime() - depTzOffset;
    }

    set({
      route,
      phase: 'BOARDING',
      progress: 0,
      elapsedTime: 0,
      isActive: true,
      isPaused: false,
      viewMode: 'simulation',
      departureTimeUTC: departureUTC,
      simulationDate: new Date(departureUTC),
      groundElapsed: 0,
      sessionRealSeconds: 0,
      cruiseRealSeconds: 0,
      departedLocalHour: getLocalHourInTimezone(new Date(departureUTC), departure.timezone),
      arrivalProcessed: false,
      position: {
        lat: departure.lat,
        lng: departure.lng,
        altitude: 0,
        speed: 0,
        heading: route.bearing,
        progress: 0,
        distanceRemaining: route.distance,
        timeRemaining: route.duration,
      },
    });
  },

  pauseFlight: () => {
    set({ isPaused: true });
    // Persist immediately on pause so closing the tab preserves state
    const s = get();
    if (s.isActive && s.route && s.departure && s.arrival) {
      savePersistedFlight({
        departure: s.departure,
        arrival: s.arrival,
        route: s.route,
        phase: s.phase,
        position: s.position,
        progress: s.progress,
        elapsedTime: s.elapsedTime,
        isActive: true,
        isPaused: true,
        timeScale: s.timeScale,
        viewMode: s.viewMode,
        groundElapsed: s.groundElapsed,
        timeMode: s.timeMode,
        departureTimeUTC: s.departureTimeUTC,
        customHour: s.customHour,
        simulationDateMs: s.simulationDate.getTime(),
        sessionRealSeconds: s.sessionRealSeconds,
        cruiseRealSeconds: s.cruiseRealSeconds,
        departedLocalHour: s.departedLocalHour,
        arrivalProcessed: s.arrivalProcessed,
        savedAt: Date.now(),
      });
    }
  },
  resumeFlight: () => set({ isPaused: false }),
  markArrivalProcessed: () => set({ arrivalProcessed: true }),

  stopFlight: () => {
    clearPersistedFlight();
    set({
      route: null,
      arrival: null,
      phase: 'BOARDING',
      progress: 0,
      elapsedTime: 0,
      isActive: false,
      isPaused: false,
      viewMode: 'grounded',
      simulationDate: new Date(),
      groundElapsed: 0,
      sessionRealSeconds: 0,
      cruiseRealSeconds: 0,
      departedLocalHour: null,
      position: { lat: 0, lng: 0, altitude: 0, speed: 0, heading: 0, progress: 0, distanceRemaining: 0, timeRemaining: 0 },
    });
  },

  returnToGrounded: () => {
    clearPersistedFlight();
    set({
      route: null,
      arrival: null,
      phase: 'BOARDING',
      progress: 0,
      elapsedTime: 0,
      isActive: false,
      isPaused: false,
      viewMode: 'grounded',
      groundElapsed: 0,
      sessionRealSeconds: 0,
      cruiseRealSeconds: 0,
      departedLocalHour: null,
      position: { lat: 0, lng: 0, altitude: 0, speed: 0, heading: 0, progress: 0, distanceRemaining: 0, timeRemaining: 0 },
    });
  },

  setTimeScale: (scale) => set({ timeScale: scale }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setCustomHour: (hour) => set({ customHour: hour }),

  tick: (deltaSeconds) => {
    const {
      isActive, isPaused, timeScale, elapsedTime, route,
      groundElapsed, sessionRealSeconds, cruiseRealSeconds, departureTimeUTC,
    } = get();
    if (!isActive || isPaused || !route) return;

    // Real (unscaled) wall-clock time the sim has been running this leg.
    const newSessionReal = sessionRealSeconds + deltaSeconds;

    // --- Ground sequence (boarding -> taxi -> takeoff) -------------------
    // Runs in REAL time, unaffected by timeScale. The aircraft stays parked at
    // the departure point: progress stays 0, so no great-circle movement.
    if (groundElapsed < GROUND_TOTAL_SECONDS) {
      const newGround = Math.min(GROUND_TOTAL_SECONDS, groundElapsed + deltaSeconds);
      const phase = getGroundPhase(newGround) ?? 'TAKEOFF';
      const speed = getGroundSpeed(newGround);
      // Day/night clock advances through the notional ground-world duration.
      const simDate = new Date(
        departureTimeUTC + (newGround / GROUND_TOTAL_SECONDS) * GROUND_WORLD_SECONDS * 1000
      );

      set({
        groundElapsed: newGround,
        phase,
        progress: 0,
        elapsedTime: 0,
        simulationDate: simDate,
        sessionRealSeconds: newSessionReal,
        position: {
          lat: route.departure.lat,
          lng: route.departure.lng,
          altitude: 0,
          speed,
          heading: route.bearing,
          progress: 0,
          distanceRemaining: route.distance,
          timeRemaining: route.duration,
        },
      });
      return;
    }

    // --- Airborne (flight clock starts here, scaled by timeScale) --------
    const scaledDelta = deltaSeconds * timeScale;
    const newElapsed = elapsedTime + scaledDelta;
    const progress = Math.min(1, newElapsed / route.duration);
    const phase = getPhaseForProgress(progress);

    const newCruiseReal = phase === 'CRUISE' ? cruiseRealSeconds + deltaSeconds : cruiseRealSeconds;

    const routePoint = getPositionAtProgress(route, progress);
    const altitude = getAltitudeForProgress(progress);
    const speed = getSpeedForProgress(progress);

    const distanceRemaining = route.distance * (1 - progress);
    const timeRemaining = Math.max(0, route.duration - newElapsed);

    // Real-world time at the aircraft position: notional ground time + airborne time.
    const simDate = new Date(
      departureTimeUTC + (GROUND_WORLD_SECONDS + progress * route.duration) * 1000
    );

    set({
      elapsedTime: newElapsed,
      progress,
      phase,
      simulationDate: simDate,
      sessionRealSeconds: newSessionReal,
      cruiseRealSeconds: newCruiseReal,
      position: {
        lat: routePoint.lat,
        lng: routePoint.lng,
        altitude,
        speed,
        heading: routePoint.bearing,
        progress,
        distanceRemaining,
        timeRemaining,
      },
    });

    if (progress >= 1) {
      clearPersistedFlight();
      set({ phase: 'ARRIVED', isPaused: true });
    }

    // Throttled persistence — save every ~2s so tab close preserves state
    const now = Date.now();
    const state = get();
    if (now - (state as any)._lastPersistMs > PERSIST_INTERVAL_MS) {
      (state as any)._lastPersistMs = now;
      if (state.isActive && state.route && state.departure && state.arrival) {
        savePersistedFlight({
          departure: state.departure,
          arrival: state.arrival,
          route: state.route,
          phase,
          position: state.position,
          progress,
          elapsedTime: newElapsed,
          isActive: true,
          isPaused: false,
          timeScale: state.timeScale,
          viewMode: state.viewMode,
          groundElapsed: state.groundElapsed,
          timeMode: state.timeMode,
          departureTimeUTC: state.departureTimeUTC,
          customHour: state.customHour,
          simulationDateMs: simDate.getTime(),
          sessionRealSeconds: newSessionReal,
          cruiseRealSeconds: newCruiseReal,
          departedLocalHour: state.departedLocalHour,
          arrivalProcessed: state.arrivalProcessed,
          savedAt: now,
        });
      }
    }
  },

  restorePersistedFlight: () => {
    const p = loadPersistedFlight();
    if (!p) return false;
    set({
      departure: p.departure,
      arrival: p.arrival,
      route: p.route,
      phase: p.phase,
      position: p.position,
      progress: p.progress,
      elapsedTime: p.elapsedTime,
      isActive: p.isActive,
      isPaused: true, // always resume paused so user can unpause
      timeScale: p.timeScale,
      viewMode: 'simulation',
      groundElapsed: p.groundElapsed,
      timeMode: p.timeMode,
      departureTimeUTC: p.departureTimeUTC,
      customHour: p.customHour,
      simulationDate: new Date(p.simulationDateMs),
      sessionRealSeconds: p.sessionRealSeconds,
      cruiseRealSeconds: p.cruiseRealSeconds,
      departedLocalHour: p.departedLocalHour,
      arrivalProcessed: p.arrivalProcessed,
    });
    return true;
  },

  discardPersistedFlight: () => {
    clearPersistedFlight();
  },
}));
