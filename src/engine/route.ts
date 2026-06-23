import type { Airport } from '@/types/airport';
import type { FlightRoute, RoutePoint } from '@/types/flight';
import {
  greatCircleDistance,
  initialBearing,
  intermediatePoint,
  estimateFlightDuration,
} from './navigation';

function toRad(deg: number): number { return (deg * Math.PI) / 180; }
function toDeg(rad: number): number { return (rad * 180) / Math.PI; }

/**
 * Offset a lat/lng point perpendicular to a bearing by a given distance in km.
 */
function offsetPerpendicular(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number
): { lat: number; lng: number } {
  const R = 6371;
  const brng = toRad(bearingDeg);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const dr = distanceKm / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(brng)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(dr) * Math.cos(lat1),
    Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2)
  );

  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

/**
 * Smoothstep easing: 0 at t=0, 1 at t=1, smooth in/out.
 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function generateFlightRoute(
  departure: Airport,
  arrival: Airport,
  numPoints: number = 200
): FlightRoute {
  const distance = greatCircleDistance(
    departure.lat,
    departure.lng,
    arrival.lat,
    arrival.lng
  );

  const bearing = initialBearing(
    departure.lat,
    departure.lng,
    arrival.lat,
    arrival.lng
  );

  const duration = estimateFlightDuration(distance);

  // Banking parameters — what fraction of the route is curved departure/approach
  const DEPARTURE_TURN_END = 0.08;   // first 8%: curved departure turn
  const APPROACH_TURN_START = 0.92;  // last 8%: curved approach turn
  const TURN_OFFSET_KM = Math.min(distance * 0.03, 50); // lateral offset for banking

  // Use a perpendicular offset to create the banking curve.
  // Departure: offset perpendicular to the great-circle bearing, then blend back.
  // Approach: offset from the other side, blending in to align with "runway".
  const perpBearing = (bearing + 90) % 360;

  const points: RoutePoint[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const gcPoint = intermediatePoint(
      departure.lat,
      departure.lng,
      arrival.lat,
      arrival.lng,
      progress
    );

    let lat = gcPoint.lat;
    let lng = gcPoint.lng;

    // Departure banking curve: start offset perpendicular, blend to great-circle
    if (progress < DEPARTURE_TURN_END) {
      const t = progress / DEPARTURE_TURN_END;
      const eased = 1 - smoothstep(t); // 1 at start, 0 at end
      const offset = offsetPerpendicular(lat, lng, perpBearing, TURN_OFFSET_KM * eased);
      lat = offset.lat;
      lng = offset.lng;
    }

    // Approach banking curve: blend from great-circle to offset, then back to runway
    if (progress > APPROACH_TURN_START) {
      const t = (progress - APPROACH_TURN_START) / (1 - APPROACH_TURN_START);
      // Rise then fall: peak offset at t=0.5, back to 0 at t=1 (aligned with runway)
      const curve = Math.sin(t * Math.PI); // 0 -> 1 -> 0
      const offset = offsetPerpendicular(lat, lng, (bearing + 270) % 360, TURN_OFFSET_KM * curve);
      lat = offset.lat;
      lng = offset.lng;
    }

    const distanceFromStart = distance * progress;

    let pointBearing = bearing;
    if (i < numPoints) {
      // Compute next point with same offset logic for accurate bearing
      const nextProgress = (i + 1) / numPoints;
      const nextGc = intermediatePoint(
        departure.lat,
        departure.lng,
        arrival.lat,
        arrival.lng,
        nextProgress
      );
      let nLat = nextGc.lat;
      let nLng = nextGc.lng;
      if (nextProgress < DEPARTURE_TURN_END) {
        const nt = nextProgress / DEPARTURE_TURN_END;
        const nEased = 1 - smoothstep(nt);
        const nOff = offsetPerpendicular(nLat, nLng, perpBearing, TURN_OFFSET_KM * nEased);
        nLat = nOff.lat; nLng = nOff.lng;
      }
      if (nextProgress > APPROACH_TURN_START) {
        const nt = (nextProgress - APPROACH_TURN_START) / (1 - APPROACH_TURN_START);
        const nCurve = Math.sin(nt * Math.PI);
        const nOff = offsetPerpendicular(nLat, nLng, (bearing + 270) % 360, TURN_OFFSET_KM * nCurve);
        nLat = nOff.lat; nLng = nOff.lng;
      }
      pointBearing = initialBearing(lat, lng, nLat, nLng);
    }

    points.push({
      lat,
      lng,
      distanceFromStart,
      bearing: pointBearing,
      progress,
    });
  }

  return {
    departure,
    arrival,
    distance,
    duration,
    bearing,
    points,
  };
}

export function getPositionAtProgress(
  route: FlightRoute,
  progress: number
): RoutePoint {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const index = Math.min(
    Math.floor(clampedProgress * (route.points.length - 1)),
    route.points.length - 2
  );

  const p1 = route.points[index];
  const p2 = route.points[index + 1];

  const segmentProgress =
    (clampedProgress - p1.progress) / (p2.progress - p1.progress || 1);

  return {
    lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
    lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
    distanceFromStart: p1.distanceFromStart + (p2.distanceFromStart - p1.distanceFromStart) * segmentProgress,
    bearing: p1.bearing + (p2.bearing - p1.bearing) * segmentProgress,
    progress: clampedProgress,
  };
}
