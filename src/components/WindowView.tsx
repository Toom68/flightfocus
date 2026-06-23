import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sun, Moon, MapPin } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { getSolarPosition, formatTimeInTimezone } from '@/utils/time';
import { Scene2D } from './window/Scene2D';

export function WindowView() {
  const { position, phase, simulationDate, departure, arrival } = useFlightStore();

  const solarData = useMemo(() => {
    if (position.lat === 0 && position.lng === 0) return null;
    return getSolarPosition(position.lat, position.lng, simulationDate);
  }, [position.lat, position.lng, simulationDate]);

  const isDay = solarData?.isDaytime ?? false;
  const depTime = departure ? formatTimeInTimezone(simulationDate, departure.timezone) : '--:--';
  const arrTime = arrival ? formatTimeInTimezone(simulationDate, arrival.timezone) : '--:--';
  const hasMultipleTZ = departure && arrival && departure.timezone !== arrival.timezone;
  const flightLevel = `FL${Math.round(position.altitude / 100).toString().padStart(3, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0a0d] select-none"
    >
      {/* 3D scene — fills entire container, we mask the edges with the wall on top */}
      <div className="absolute inset-0">
        <Scene2D
          altitude={position.altitude}
          phase={phase}
          speed={position.speed}
          progress={position.progress}
          solarData={solarData}
        />
      </div>

      {/* Cabin wall — opaque border surrounding the window opening.
          Uses box-shadow to create a thick frame without covering the center. */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{ inset: 0 }}
      >
        <div
          className="relative"
          style={{
            width: '76%',
            height: '88%',
            borderRadius: '28px',
            boxShadow: '0 0 0 100vmax #0e0e12, 0 0 0 6px #2a2a32, 0 0 0 7px #3a3a42',
          }}
        >
          {/* Inner shadow vignette inside the window */}
          <div
            className="absolute -inset-0 rounded-[28px] pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 24px 6px rgba(0,0,0,0.5)',
            }}
          />

          {/* Glass reflection — diagonal sheen */}
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none overflow-hidden"
            style={{
              background: 'linear-gradient(125deg, rgba(200,220,255,0.08) 0%, rgba(200,220,255,0.02) 30%, transparent 50%, transparent 70%, rgba(255,255,255,0.03) 100%)',
            }}
          />

          {/* Subtle vertical light streak */}
          <motion.div
            className="absolute inset-y-0 pointer-events-none"
            style={{
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
            }}
            animate={{ x: ['-10%', '120%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }}
          />

          {/* Bottom glass glow — warm cabin reflection */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none rounded-b-[28px]"
            style={{
              background: 'linear-gradient(to top, rgba(255,200,140,0.06), transparent)',
            }}
          />

          {/* Inner trim highlight ring */}
          <div
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
        </div>
      </div>

      {/* Top-right: phase indicator */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06]">
          <Plane className="w-3 h-3 text-cabin-accent" />
          <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">{phase}</span>
        </div>
      </div>

      {/* Bottom-left: time + altitude */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            {isDay ? (
              <Sun className="w-3 h-3 text-amber-300/80" />
            ) : (
              <Moon className="w-3 h-3 text-blue-200/70" />
            )}
            <span className="text-[11px] font-mono text-white/70">{depTime}</span>
            {hasMultipleTZ && (
              <>
                <span className="text-[10px] text-white/30">→</span>
                <span className="text-[11px] font-mono text-white/50">{arrTime}</span>
              </>
            )}
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[11px] font-mono text-cabin-accent/80">{flightLevel}</span>
        </div>
      </div>

      {/* Bottom-right: coordinates */}
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.06]">
          <MapPin className="w-3 h-3 text-white/40" />
          <span className="text-[10px] font-mono text-white/50">
            {position.lat.toFixed(1)}°, {position.lng.toFixed(1)}°
          </span>
        </div>
      </div>
    </motion.div>
  );
}
