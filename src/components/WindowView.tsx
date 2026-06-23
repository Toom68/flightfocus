import { useMemo } from 'react';
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
    <div
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
          {/* Thin inner shadow ring — only the edge, not the center */}
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
    </div>
  );
}
