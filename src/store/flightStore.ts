import { create } from 'zustand';
import type { Airport } from '@/types/airport';
import type { FlightPhase, FlightRoute, FlightPosition } from '@/types/flight';
import type { ViewMode } from '@/types/simulation';
import { generateFlightRoute, getPositionAtProgress } from '@/engine/route';
import { getPhaseForProgress, getProgressForElapsedTime } from '@/engine/simulation';
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
  boardingDuration: number;
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
  boardingDuration: 120,
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
    const { isActive, isPaused, timeScale, elapsedTime, route, boardingDuration, sessionRealSeconds, cruiseRealSeconds } = get();
    if (!isActive || isPaused || !route) return;

    const scaledDelta = deltaSeconds * timeScale;
    const newElapsed = elapsedTime + scaledDelta;
    const progress = getProgressForElapsedTime(newElapsed, route.duration, boardingDuration);
    const phase = getPhaseForProgress(progress);

    // Accumulate REAL (unscaled) wall-clock time the sim has been running this leg.
    const newSessionReal = sessionRealSeconds + deltaSeconds;
    const newCruiseReal = phase === 'CRUISE' ? cruiseRealSeconds + deltaSeconds : cruiseRealSeconds;

    const routePoint = getPositionAtProgress(route, progress);
    const altitude = getAltitudeForProgress(progress);
    const speed = getSpeedForProgress(progress);

    const distanceRemaining = route.distance * (1 - progress);
    const timeRemaining = Math.max(0, route.duration - (newElapsed - boardingDuration));

    // Calculate the real-world time at the aircraft position
    // elapsedTime is in sim-seconds but route.duration is the real flight duration in seconds
    // progress maps linearly to real flight time
    const { departureTimeUTC, boardingDuration: bd } = get();
    const realFlightElapsed = progress * route.duration; // seconds of real flight time elapsed
    const realTotalElapsed = bd + realFlightElapsed; // include boarding time as real time
    const simDate = new Date(departureTimeUTC + realTotalElapsed * 1000);

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
