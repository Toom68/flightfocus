import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFlightStore } from '@/store/flightStore';
import { formatDuration } from '@/engine/simulation';

const planeIcon = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="rgba(59,130,246,0.2)"/>
    <path d="M12 4L8 12L12 10L16 12L12 4Z" fill="white" stroke="white" stroke-width="0.5"/>
    <path d="M12 10L8 18L12 16L16 18L12 10Z" fill="rgba(255,255,255,0.5)"/>
  </svg>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const depIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:2px solid #93c5fd;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const arrIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#f59e0b;border:2px solid #fcd34d;border-radius:50%;box-shadow:0 0 8px rgba(245,158,11,0.6);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      map.setView(center, zoom, { animate: false });
      initRef.current = true;
    }
  }, [map, center, zoom]);

  return null;
}

export function FlightMap() {
  const { route, position, progress } = useFlightStore();

  if (!route) return null;

  const centerLat = (route.departure.lat + route.arrival.lat) / 2;
  const centerLng = (route.departure.lng + route.arrival.lng) / 2;

  const latSpan = Math.abs(route.departure.lat - route.arrival.lat);
  const lngSpan = Math.abs(route.departure.lng - route.arrival.lng);
  const maxSpan = Math.max(latSpan, lngSpan);
  const zoom = maxSpan > 100 ? 3 : maxSpan > 50 ? 4 : maxSpan > 20 ? 5 : 6;

  const routeLatLngs: [number, number][] = route.points
    .filter((_: unknown, i: number) => i % 3 === 0 || i === route.points.length - 1)
    .map((p: { lat: number; lng: number }) => [p.lat, p.lng]);

  const traveledIndex = Math.floor(progress * (routeLatLngs.length - 1));
  const traveledLatLngs = routeLatLngs.slice(0, traveledIndex + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-800/50"
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        style={{ background: '#070d1a' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={[centerLat, centerLng]} zoom={zoom} />

        <Polyline
          positions={routeLatLngs}
          pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.3, dashArray: '8 6' }}
        />

        {traveledLatLngs.length > 1 && (
          <Polyline
            positions={traveledLatLngs}
            pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.9 }}
          />
        )}

        <Marker position={[route.departure.lat, route.departure.lng]} icon={depIcon} />
        <Marker position={[route.arrival.lat, route.arrival.lng]} icon={arrIcon} />
        <Marker position={[position.lat, position.lng]} icon={planeIcon} />
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-mono text-cabin-accent border border-blue-900/30">
          {route.departure.iata}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-px bg-cabin-accent/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-cabin-accent/40" />
          <div className="w-2 h-px bg-cabin-accent/40" />
        </div>
        <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-mono text-cabin-gold border border-yellow-900/30">
          {route.arrival.iata}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <span className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] font-mono text-gray-400">
          {(progress * 100).toFixed(1)}%
        </span>
        <span className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] font-mono text-gray-400">
          ETA {formatDuration(position.timeRemaining)}
        </span>
      </div>
    </motion.div>
  );
}
