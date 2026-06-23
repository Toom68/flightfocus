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
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0a0d] select-none">
      {/* Sky scene fills entire container */}
      <div className="absolute inset-0">
        <Scene2D
          altitude={position.altitude}
          phase={phase}
          speed={position.speed}
          progress={position.progress}
          solarData={solarData}
        />
      </div>

      {/* Oval cabin window frame — SVG mask creates the window opening */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <mask id="ovalWindow">
            <rect width="100%" height="100%" fill="white" />
            <ellipse cx="50%" cy="50%" rx="38%" ry="44%" fill="black" />
          </mask>
        </defs>
        {/* Wall fill with mask cutout */}
        <rect width="100%" height="100%" fill="#0e0e12" mask="url(#ovalWindow)" />
        {/* Inner ring highlight */}
        <ellipse cx="50%" cy="50%" rx="38%" ry="44%" fill="none" stroke="#2a2a32" strokeWidth="3" />
        <ellipse cx="50%" cy="50%" rx="38%" ry="44%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>

      {/* Top-right: phase indicator */}
      <div className="absolute top-3 right-3 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06]">
          <Plane className="w-3 h-3 text-cabin-accent" />
          <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">{phase}</span>
        </div>
      </div>

      {/* Bottom-left: time + altitude */}
      <div className="absolute bottom-3 left-3 pointer-events-none z-10">
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
      <div className="absolute bottom-3 right-3 pointer-events-none z-10">
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
