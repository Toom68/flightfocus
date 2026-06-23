import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plane, Route } from 'lucide-react';
import type { SaveGame } from '@/types/savegame';
import { getContinent } from '@/utils/geo';
import { formatDistance } from '@/engine/simulation';

interface LogbookViewProps {
  save: SaveGame;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function LogbookView({ save }: LogbookViewProps) {
  // Most recent first; the origin (index 0) is shown as the journey's start.
  const stops = useMemo(() => [...save.visitedAirports].reverse(), [save.visitedAirports]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Plane} label="Flights" value={String(save.stats.totalFlights)} />
        <Stat icon={MapPin} label="Airports" value={String(new Set(save.visitedAirports.map((v) => v.iata)).size)} />
        <Stat icon={Route} label="Distance" value={formatDistance(save.stats.totalDistanceKm)} />
      </div>

      <div className="relative pl-4">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-800" />
        {stops.map((stop, i) => {
          const isCurrent = i === 0;
          const isOrigin = stop.iata === save.originIata && stop.departedFrom === save.originIata && i === stops.length - 1;
          return (
            <motion.div
              key={`${stop.iata}-${stop.arrivedAt}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className="relative pl-4 pb-3"
            >
              <span
                className={`absolute -left-[1px] top-1.5 w-3 h-3 rounded-full border-2 ${
                  isCurrent
                    ? 'bg-cabin-gold border-cabin-gold'
                    : 'bg-cabin-dark border-gray-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">{stop.iata}</span>
                    <span className="text-sm text-gray-300 truncate">{stop.airport.city}</span>
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cabin-gold/20 text-cabin-gold">You are here</span>}
                    {isOrigin && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cabin-accent/20 text-cabin-accent">Start</span>}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {getContinent(stop.airport)} · {stop.airport.country}
                    {stop.distanceKm > 0 && <> · {formatDistance(stop.distanceKm)} from {stop.departedFrom}</>}
                  </p>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">{formatDate(stop.arrivedAt)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="bg-cabin-dim/40 border border-white/[0.04] rounded-lg p-2.5 text-center shadow-soft">
      <Icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
      <p className="text-sm font-mono text-white">{value}</p>
      <p className="text-[10px] text-gray-600">{label}</p>
    </div>
  );
}
