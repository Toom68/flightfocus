import { useMemo, useEffect, useCallback } from 'react';
import { Plane, Sun, Moon, MapPin, CloudRain } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { useWeatherStore } from '@/store/weatherStore';
import { getSolarPosition, formatTimeInTimezone } from '@/utils/time';
import { MapboxView } from './window/MapboxView';
import { RainOverlay } from './window/RainOverlay';
import { isRaining, type WeatherCondition } from '@/types/weather';
import { getBiome } from '@/utils/biome';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

const WEATHER_CYCLE: WeatherCondition[] = ['clear', 'partly_cloudy', 'cloudy', 'overcast', 'drizzle', 'rain', 'heavy_rain', 'thunderstorm', 'fog'];

export function WindowView() {
  const { position, phase, simulationDate, departure, arrival } = useFlightStore();
  const weatherCondition = useWeatherStore((s) => s.condition);
  const fetchWeather = useWeatherStore((s) => s.fetchWeather);
  const setCondition = useWeatherStore((s) => s.setCondition);

  const solarData = useMemo(() => {
    if (position.lat === 0 && position.lng === 0) return null;
    return getSolarPosition(position.lat, position.lng, simulationDate);
  }, [position.lat, position.lng, simulationDate]);

  // Fetch weather when position changes significantly (every ~5 deg).
  const weatherKey = `${Math.round(position.lat / 5)}_${Math.round(position.lng / 5)}`;
  useEffect(() => {
    if (position.lat !== 0 || position.lng !== 0) {
      fetchWeather(position.lat, position.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherKey]);

  // Debug: press 'W' to cycle weather conditions for testing rain overlay.
  const cycleWeather = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey) {
      const cur = useWeatherStore.getState().condition;
      const idx = WEATHER_CYCLE.indexOf(cur);
      const next = WEATHER_CYCLE[(idx + 1) % WEATHER_CYCLE.length];
      setCondition(next);
      console.log('[Weather] Set to:', next);
    }
  }, [setCondition]);

  useEffect(() => {
    window.addEventListener('keydown', cycleWeather);
    return () => window.removeEventListener('keydown', cycleWeather);
  }, [cycleWeather]);

  const isDay = solarData?.isDaytime ?? false;
  const depTime = departure ? formatTimeInTimezone(simulationDate, departure.timezone) : '--:--';
  const arrTime = arrival ? formatTimeInTimezone(simulationDate, arrival.timezone) : '--:--';
  const hasMultipleTZ = departure && arrival && departure.timezone !== arrival.timezone;
  const flightLevel = `FL${Math.round(position.altitude / 100).toString().padStart(3, '0')}`;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-cabin-dark border border-white/[0.04] select-none">
      {/* Mapbox tilted map view fills the window */}
      {MAPBOX_TOKEN ? (
        <MapboxView
          lat={position.lat}
          lng={position.lng}
          altitude={position.altitude}
          speed={position.speed}
          heading={position.heading}
          phase={phase}
          weatherCondition={weatherCondition}
          mapboxToken={MAPBOX_TOKEN}
          solarData={solarData}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 max-w-xs">
            <p className="text-xs text-white/40 leading-relaxed">
              Add a Mapbox token to <code className="text-white/60 bg-white/10 px-1 rounded">.env.local</code> as<br />
              <code className="text-white/60 bg-white/10 px-1 rounded">VITE_MAPBOX_TOKEN=pk....</code><br />
              Get a free token at mapbox.com
            </p>
          </div>
        </div>
      )}

      {/* Rain overlay on the window */}
      <RainOverlay />

      {/* Cabin window frame — SVG mask creates the window opening */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <mask id="ovalWindow">
            <rect width="100%" height="100%" fill="white" />
            <ellipse cx="50%" cy="50%" rx="28%" ry="42%" fill="black" />
          </mask>
          <radialGradient id="wallGrad" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#101724" />
            <stop offset="60%" stopColor="#0a0e1a" />
            <stop offset="100%" stopColor="#06090f" />
          </radialGradient>
          <radialGradient id="bezelGrad" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#2a3548" />
            <stop offset="50%" stopColor="#1a2030" />
            <stop offset="100%" stopColor="#0d121c" />
          </radialGradient>
        </defs>

        {/* Wall fill with mask cutout */}
        <rect width="100%" height="100%" fill="url(#wallGrad)" mask="url(#ovalWindow)" />

        {/* Outer bezel — thick frame ring */}
        <ellipse cx="50%" cy="50%" rx="28%" ry="42%" fill="none" stroke="url(#bezelGrad)" strokeWidth="8" />
        {/* Mid bezel — subtle highlight on top edge */}
        <ellipse cx="50%" cy="50%" rx="28%" ry="42%" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        {/* Inner edge — dark shadow for depth */}
        <ellipse cx="50%" cy="50%" rx="27%" ry="41%" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="3" />
        {/* Inner rim — faint light catch */}
        <ellipse cx="50%" cy="50%" rx="26.5%" ry="40.5%" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>

      {/* Top-right: phase + biome + weather indicator */}
      <div className="absolute top-3 right-3 pointer-events-none z-10 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.06]">
          <Plane className="w-3 h-3 text-cabin-accent" />
          <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">{phase}</span>
        </div>
        {MAPBOX_TOKEN && (() => {
          const biome = getBiome(position.lat, position.lng, [
            { lat: departure?.lat ?? 0, lng: departure?.lng ?? 0 },
            { lat: arrival?.lat ?? 0, lng: arrival?.lng ?? 0 },
          ]);
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.06]">
              <span className="text-[10px] font-medium text-white/50 tracking-wide uppercase">{biome.label}</span>
            </div>
          );
        })()}
        {isRaining(weatherCondition) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.06]">
            <CloudRain className="w-3 h-3 text-blue-300/80" />
            <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">{weatherCondition.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Bottom-left: time + altitude */}
      <div className="absolute bottom-3 left-3 pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/[0.06]">
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
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/[0.06]">
          <MapPin className="w-3 h-3 text-white/40" />
          <span className="text-[10px] font-mono text-white/50">
            {position.lat.toFixed(1)}°, {position.lng.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}
