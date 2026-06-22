import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, Plane, MapPin, Clock, ArrowRight } from 'lucide-react';
import type { Airport } from '@/types/airport';
import { airports } from '@/data/airports';
import {
  greatCircleDistance, estimateFlightDuration, initialBearing, generateRoutePoints,
} from '@/engine/navigation';
import { formatDuration, formatDistance } from '@/engine/simulation';
import { searchAirports } from '@/utils/search';

interface WorldMapPickerProps {
  from: Airport;
  onSelect: (airport: Airport) => void;
  onClose: () => void;
}

const dotIcon = L.divIcon({
  html: `<div style="width:8px;height:8px;background:#64748b;border:1.5px solid #94a3b8;border-radius:50%;"></div>`,
  className: 'ff-dot',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const fromIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#f59e0b;border:2px solid #fcd34d;border-radius:50%;box-shadow:0 0 10px rgba(245,158,11,0.7);"></div>`,
  className: 'ff-from',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const selectedIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:2px solid #93c5fd;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>`,
  className: 'ff-sel',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyTo({ target }: { target: Airport | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 3), { duration: 0.8 });
  }, [target, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Leaflet often mis-measures the container when mounted inside an
    // animated / flex modal.  Force it to recompute after the animation
    // has had time to settle.
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [map]);
  return null;
}

export function WorldMapPicker({ from, onSelect, onClose }: WorldMapPickerProps) {
  const [selected, setSelected] = useState<Airport | null>(null);
  const [query, setQuery] = useState('');

  const searchResults = useMemo(
    () => (query.length > 0 ? searchAirports(query, 6) : []),
    [query]
  );

  const distance = selected
    ? greatCircleDistance(from.lat, from.lng, selected.lat, selected.lng)
    : 0;
  const duration = distance > 0 ? estimateFlightDuration(distance) : 0;
  const bearing = selected ? initialBearing(from.lat, from.lng, selected.lat, selected.lng) : 0;

  const routeLatLngs: [number, number][] = useMemo(() => {
    if (!selected) return [];
    return generateRoutePoints(from.lat, from.lng, selected.lat, selected.lng, 64).map(
      (p) => [p.lat, p.lng] as [number, number]
    );
  }, [from, selected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-cabin-panel border border-gray-700 rounded-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cabin-accent" />
            <span className="text-sm font-medium text-white">Choose your destination</span>
            <span className="text-xs text-gray-500">from {from.city} ({from.iata})</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-800 relative z-[1100]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a city or airport..."
              className="w-full pl-10 pr-4 py-2.5 bg-cabin-dim/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cabin-accent/50 text-sm"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 mt-1 z-[1200] bg-cabin-panel border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
              {searchResults.map((r) => (
                <button
                  key={r.airport.iata}
                  onClick={() => { setSelected(r.airport); setQuery(''); }}
                  disabled={r.airport.iata === from.iata}
                  className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-cabin-dim/50 disabled:opacity-40 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0">
                    <span className="font-mono text-sm text-white">{r.airport.iata}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.airport.city}, {r.airport.country}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative h-[52vh] shrink-0">
          <MapContainer
            center={[from.lat, from.lng]}
            zoom={2}
            minZoom={2}
            worldCopyJump
            className="w-full h-full"
            zoomControl={false}
            attributionControl={false}
            style={{ background: '#070d1a' }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <MapResizer />
            <FlyTo target={selected} />

            {routeLatLngs.length > 1 && (
              <Polyline
                positions={routeLatLngs}
                pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.8, dashArray: '8 6' }}
              />
            )}

            {airports.map((a) => {
              const isFrom = a.iata === from.iata;
              const isSel = selected?.iata === a.iata;
              return (
                <Marker
                  key={a.iata}
                  position={[a.lat, a.lng]}
                  icon={isFrom ? fromIcon : isSel ? selectedIcon : dotIcon}
                  eventHandlers={{ click: () => { if (!isFrom) setSelected(a); } }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={isFrom || isSel}>
                    <span className="font-mono text-[11px]">{a.iata}</span>
                    <span className="text-[10px] text-gray-500"> · {a.city}</span>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Confirm bar */}
        <div className="p-4 border-t border-gray-800">
          {selected ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-bold text-white">{from.iata}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <span className="font-mono font-bold text-cabin-accent">{selected.iata}</span>
                  <span className="text-gray-400 truncate">— {selected.city}, {selected.country}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{formatDistance(distance)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(duration)}</span>
                  <span>Bearing {Math.round(bearing)}°</span>
                </div>
              </div>
              <button
                onClick={() => onSelect(selected)}
                className="w-full sm:w-auto px-6 py-3 bg-cabin-accent hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                <Plane className="w-4 h-4" />
                Fly to {selected.iata}
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500">Tap an airport on the map or search to pick where you'll fly next.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
