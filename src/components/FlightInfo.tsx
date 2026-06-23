import { motion } from 'framer-motion';
import { Plane, Clock, Navigation, Gauge, Mountain } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { getPhaseDescription, formatDuration, formatDistance } from '@/engine/simulation';
import { formatTimeInTimezone } from '@/utils/time';

export function FlightInfo() {
  const { phase, position, route, progress, simulationDate, departure, arrival } = useFlightStore();

  if (!route) return null;

  const etaArrivalTime = arrival
    ? formatTimeInTimezone(new Date(simulationDate.getTime() + position.timeRemaining * 1000), arrival.timezone)
    : formatDuration(position.timeRemaining);

  const stats = [
    {
      icon: Gauge,
      label: 'Speed',
      value: `${Math.round(position.speed)} kts`,
    },
    {
      icon: Mountain,
      label: 'Altitude',
      value: position.altitude > 0 ? `${Math.round(position.altitude).toLocaleString()} ft` : 'Ground',
    },
    {
      icon: Navigation,
      label: 'Heading',
      value: `${Math.round(position.heading)}°`,
    },
    {
      icon: Clock,
      label: 'ETA',
      value: etaArrivalTime,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-cabin-accent" />
          <span className="text-sm font-medium text-white">{getPhaseDescription(phase)}</span>
        </div>
        <span className="text-xs font-mono text-gray-500">
          {route.departure.iata} → {route.arrival.iata}
        </span>
      </div>

      <div className="relative h-1.5 bg-gray-800 rounded-full mb-4 overflow-hidden shadow-inner">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cabin-accent to-cabin-gold rounded-full shadow-glow"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
            <p className="text-xs font-mono text-white">{stat.value}</p>
            <p className="text-[10px] text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-gray-500">
        <span>{formatDistance(route.distance - position.distanceRemaining)} flown</span>
        <span>{formatDistance(position.distanceRemaining)} remaining</span>
      </div>

      {departure && arrival && (
        <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
          <span className="text-gray-500">
            <span className="text-gray-400 font-mono">{departure.iata}</span>{' '}
            {formatTimeInTimezone(simulationDate, departure.timezone)}
          </span>
          <span className="text-gray-500">
            <span className="text-gray-400 font-mono">{arrival.iata}</span>{' '}
            {formatTimeInTimezone(simulationDate, arrival.timezone)}
          </span>
        </div>
      )}
    </motion.div>
  );
}
