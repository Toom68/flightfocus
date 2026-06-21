import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFlightStore } from '@/store/flightStore';
import { getSolarPosition, formatTimeInTimezone } from '@/utils/time';
import { SceneCanvas } from './window/SceneCanvas';

export function WindowView() {
  const { position, phase, simulationDate, departure, arrival } = useFlightStore();

  const solarData = useMemo(() => {
    if (position.lat === 0 && position.lng === 0) return null;
    return getSolarPosition(position.lat, position.lng, simulationDate);
  }, [position.lat, position.lng, simulationDate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-black select-none"
    >
      {/* 3D scene (seen through the window aperture) */}
      <div className="absolute inset-0">
        <SceneCanvas
          altitude={position.altitude}
          phase={phase}
          speed={position.speed}
          progress={position.progress}
          solarData={solarData}
        />
      </div>

      {/* Cabin wall + window frame overlay */}
      <CabinFrame />

      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] text-white/50 font-mono bg-black/40 px-2 py-0.5 rounded">
          {solarData ? (solarData.isDaytime ? '☀' : '☾') : '—'}{' '}
          {departure ? formatTimeInTimezone(simulationDate, departure.timezone) : '--:--'}
          {departure && arrival && departure.timezone !== arrival.timezone && (
            <> → {formatTimeInTimezone(simulationDate, arrival.timezone)}</>
          )}
          {' '}| FL{Math.round(position.altitude / 100).toString().padStart(3, '0')}
        </span>
        <span className="text-[10px] text-white/50 font-mono bg-black/40 px-2 py-0.5 rounded">
          {position.lat.toFixed(1)}°, {position.lng.toFixed(1)}°
        </span>
      </div>

    </motion.div>
  );
}

// SVG cabin wall with a rounded window aperture cut out, plus bezel + glass
// reflections. preserveAspectRatio="none" lets it fill any cell shape; the
// opaque wall masks the 3D scene to just the window opening.
function CabinFrame() {
  // Window aperture geometry in viewBox units (0..100 x, 0..140 y).
  const ap = { x: 21, y: 9, w: 58, h: 124, rx: 27, ry: 30 };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="wallGrad" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#2a2a30" />
          <stop offset="55%" stopColor="#1e1e24" />
          <stop offset="100%" stopColor="#121216" />
        </radialGradient>

        <linearGradient id="glassRefl" x1="0%" y1="0%" x2="60%" y2="45%">
          <stop offset="0%" stopColor="rgba(190,210,235,0.10)" />
          <stop offset="55%" stopColor="rgba(190,210,235,0.03)" />
          <stop offset="100%" stopColor="rgba(190,210,235,0)" />
        </linearGradient>

        <linearGradient id="bezelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a4a55" />
          <stop offset="50%" stopColor="#33333b" />
          <stop offset="100%" stopColor="#26262d" />
        </linearGradient>

        {/* Mask: white = wall visible, black hole = window aperture */}
        <mask id="windowHole">
          <rect x="0" y="0" width="100" height="140" fill="white" />
          <rect
            x={ap.x}
            y={ap.y}
            width={ap.w}
            height={ap.h}
            rx={ap.rx}
            ry={ap.ry}
            fill="black"
          />
        </mask>

        {/* Clip for drawing reflections only inside the glass */}
        <clipPath id="glassClip">
          <rect x={ap.x} y={ap.y} width={ap.w} height={ap.h} rx={ap.rx} ry={ap.ry} />
        </clipPath>
      </defs>

      {/* Cabin wall (everything outside the aperture) */}
      <rect x="0" y="0" width="100" height="140" fill="url(#wallGrad)" mask="url(#windowHole)" />

      {/* Subtle inner shadow ring just inside the wall opening */}
      <rect
        x={ap.x}
        y={ap.y}
        width={ap.w}
        height={ap.h}
        rx={ap.rx}
        ry={ap.ry}
        fill="none"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="2.5"
      />

      {/* Subtle glass sheen inside the aperture (no hard reflections) */}
      <g clipPath="url(#glassClip)">
        <rect x={ap.x} y={ap.y} width={ap.w} height={ap.h} fill="url(#glassRefl)" />
      </g>

      {/* Outer bezel */}
      <rect
        x={ap.x - 2.5}
        y={ap.y - 2.5}
        width={ap.w + 5}
        height={ap.h + 5}
        rx={ap.rx + 2.5}
        ry={ap.ry + 2.5}
        fill="none"
        stroke="url(#bezelGrad)"
        strokeWidth="5"
      />

      {/* Inner bezel highlight */}
      <rect
        x={ap.x}
        y={ap.y}
        width={ap.w}
        height={ap.h}
        rx={ap.rx}
        ry={ap.ry}
        fill="none"
        stroke="rgba(120,130,150,0.35)"
        strokeWidth="0.8"
      />
    </svg>
  );
}
