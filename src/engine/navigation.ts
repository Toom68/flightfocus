const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_NM = 3440.065;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function greatCircleDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function greatCircleDistanceNm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_NM * c;
}

export function initialBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function intermediatePoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  fraction: number
): { lat: number; lng: number } {
  const φ1 = toRad(lat1);
  const λ1 = toRad(lng1);
  const φ2 = toRad(lat2);
  const λ2 = toRad(lng2);

  const Δφ = φ2 - φ1;
  const Δλ = λ2 - λ1;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const A = Math.sin((1 - fraction) * δ) / Math.sin(δ);
  const B = Math.sin(fraction * δ) / Math.sin(δ);

  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);

  const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
  const lng = toDeg(Math.atan2(y, x));

  return { lat, lng };
}

export function generateRoutePoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  numPoints: number = 100
): { lat: number; lng: number; progress: number }[] {
  const points: { lat: number; lng: number; progress: number }[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const point = intermediatePoint(lat1, lng1, lat2, lng2, fraction);
    points.push({ ...point, progress: fraction });
  }

  return points;
}

// Airborne flight time only (taxi/takeoff are a separate fixed ground sequence,
// so they no longer consume flight time or great-circle distance).
export function estimateFlightDuration(distanceKm: number): number {
  const cruiseSpeedKmh = 870;
  const climbTimeMin = 20;
  const descentTimeMin = 25;

  const cruiseDistanceKm = Math.max(0, distanceKm - 200);
  const cruiseTimeMin = (cruiseDistanceKm / cruiseSpeedKmh) * 60;

  return (climbTimeMin + cruiseTimeMin + descentTimeMin) * 60;
}

// Altitude keyed off AIRBORNE progress (0 = start of climb, 1 = arrival).
export function getAltitudeForProgress(progress: number): number {
  const cruiseAltitudeFt = 36000;

  if (progress <= 0) return 0;
  // CLIMB: 0 -> 0.15, ground to cruise altitude
  if (progress < 0.04) return (progress / 0.04) * 10000;
  if (progress < 0.15) return 10000 + ((progress - 0.04) / 0.11) * 26000;
  // CRUISE: 0.15 -> 0.85
  if (progress < 0.85) return cruiseAltitudeFt;
  // DESCENT: 0.85 -> 0.95, cruise -> 10000
  if (progress < 0.95) return cruiseAltitudeFt - ((progress - 0.85) / 0.10) * 26000;
  // APPROACH/LANDING: 0.95 -> 1.0, 10000 -> 0
  if (progress < 1) return 10000 * (1 - (progress - 0.95) / 0.05);
  return 0;
}

// Speed (knots) keyed off AIRBORNE progress.
export function getSpeedForProgress(progress: number): number {
  if (progress <= 0) return 160;
  // CLIMB accelerate to cruise speed
  if (progress < 0.15) return 250 + (progress / 0.15) * 230;
  // CRUISE
  if (progress < 0.85) return 480;
  // DESCENT
  if (progress < 0.95) return 480 - ((progress - 0.85) / 0.10) * 230;
  // APPROACH/LANDING decel to touchdown
  if (progress < 1) return 250 - ((progress - 0.95) / 0.05) * 110;
  return 140;
}
