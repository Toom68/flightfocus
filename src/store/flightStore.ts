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
  timeScale: 60,
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

  pauseFlight: () => set({ isPaused: true }),
  resumeFlight: () => set({ isPaused: false }),
  markArrivalProcessed: () => set({ arrivalProcessed: true }),

  stopFlight: () => set({
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
  }),

  returnToGrounded: () => set({
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
  }),

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
      set({ phase: 'ARRIVED', isPaused: true });
    }
  },
}));
