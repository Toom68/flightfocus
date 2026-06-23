import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sun, Moon, MapPin } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { getSolarPosition, formatTimeInTimezone } from '@/utils/time';
import { SceneCanvas } from './window/SceneCanvas';

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
      {/* 3D scene clipped to the window opening */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: 'inset(6% 12% 6% 12% round 28px)',
          borderRadius: '28px',
        }}
      >
        <SceneCanvas
          altitude={position.altitude}
          phase={phase}
          speed={position.speed}
          progress={position.progress}
          solarData={solarData}
        />
      </div>

      {/* Cabin wall — dark gradient surrounding the window */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 76% 88% at 50% 50%, transparent 0%, transparent 62%, #15151a 63%, #0e0e12 100%)
          `,
        }}
      />

      {/* Inner shadow — dark vignette just inside the window edge */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div
          className="relative"
          style={{ width: '76%', height: '88%' }}
        >
          <div
            className="absolute -inset-1 rounded-[32px]"
            style={{
              boxShadow: 'inset 0 0 30px 8px rgba(0,0,0,0.6), inset 0 0 4px 1px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      {/* Window bezel — outer frame */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{ inset: '5.5% 11.5% 5.5% 11.5%' }}
      >
        <div
          className="relative w-full h-full rounded-[30px]"
          style={{
            background: 'linear-gradient(135deg, #3a3a42 0%, #2a2a32 30%, #1e1e26 70%, #161620 100%)',
            padding: '6px',
          }}
        >
          {/* Inner trim ring */}
          <div
            className="w-full h-full rounded-[24px] relative overflow-hidden"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 2px rgba(255,255,255,0.04)',
            }}
          >
            {/* Glass reflection — diagonal sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
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
              className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(255,200,140,0.06), transparent)',
              }}
            />
          </div>
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
