import { motion } from 'framer-motion';
import { Plane, ArrowRight, Clock, MapPin, Sun, Moon } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { AirportSearch } from './AirportSearch';
import { greatCircleDistance, estimateFlightDuration, initialBearing } from '@/engine/navigation';
import { formatDuration, formatDistance } from '@/engine/simulation';

export function FlightSetup() {
  const { departure, arrival, setDeparture, setArrival, startFlight, timeMode, setTimeMode, customHour, setCustomHour } = useFlightStore();

  const distance = departure && arrival
    ? greatCircleDistance(departure.lat, departure.lng, arrival.lat, arrival.lng)
    : 0;

  const duration = distance > 0 ? estimateFlightDuration(distance) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cabin-accent/10 border border-cabin-accent/20 mb-4"
          >
            <Plane className="w-8 h-8 text-cabin-accent" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">FlightFocus</h1>
          <p className="text-gray-400 text-sm">Select your route. Begin your focus flight.</p>
        </div>

        <div className="bg-cabin-panel/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AirportSearch
              label="Departure"
              value={departure}
              onChange={setDeparture}
              placeholder="Search departure airport..."
            />
            <AirportSearch
              label="Arrival"
              value={arrival}
              onChange={setArrival}
              placeholder="Search arrival airport..."
            />
          </div>

          {departure && arrival && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-gray-800 pt-4"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{departure.iata}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <span className="font-mono font-bold text-white">{arrival.iata}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{formatDistance(distance)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatDuration(duration)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-cabin-dim/50 rounded-lg">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Bearing: {Math.round(initialBearing(departure.lat, departure.lng, arrival.lat, arrival.lng))}°</span>
                  <span>Route: Great Circle</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-cabin-dim/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  {customHour >= 6 && customHour < 18 ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-300" />
                  )}
                  <span className="font-medium">Departure Time</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeMode('realtime')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-colors ${
                      timeMode === 'realtime'
                        ? 'bg-cabin-accent/20 text-cabin-accent border border-cabin-accent/30'
                        : 'bg-cabin-dim/50 text-gray-500 border border-gray-800 hover:text-gray-400'
                    }`}
                  >
                    Real Time
                  </button>
                  <button
                    onClick={() => setTimeMode('custom')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono transition-colors ${
                      timeMode === 'custom'
                        ? 'bg-cabin-accent/20 text-cabin-accent border border-cabin-accent/30'
                        : 'bg-cabin-dim/50 text-gray-500 border border-gray-800 hover:text-gray-400'
                    }`}
                  >
                    Custom Time
                  </button>
                </div>

                {timeMode === 'realtime' ? (
                  <p className="text-[11px] text-gray-500">
                    Uses your device clock. Sky will match real local time at departure and adjust as you fly across time zones.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Local time at {departure.iata}
                      </span>
                      <span className="text-sm font-mono text-white">
                        {String(customHour).padStart(2, '0')}:00
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={23}
                      value={customHour}
                      onChange={(e) => setCustomHour(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-gray-700 accent-cabin-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>23:00</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={!departure || !arrival}
            onClick={startFlight}
            className="w-full py-4 bg-cabin-accent hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plane className="w-5 h-5" />
            Begin Flight
          </motion.button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Simulation uses real great-circle routes and aviation calculations
        </p>
      </motion.div>
    </div>
  );
}
