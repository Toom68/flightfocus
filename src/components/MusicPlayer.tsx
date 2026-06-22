import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Play, Pause, SkipForward, SkipBack, ChevronDown, Volume2, Loader2, AlertCircle, Piano, Disc3, Radio,
} from 'lucide-react';
import { useMusicStore, type MusicGenre } from '@/store/musicStore';

const GENRES: { id: MusicGenre; label: string; icon: typeof Piano }[] = [
  { id: 'classical', label: 'Classical', icon: Piano },
  { id: 'jazz', label: 'Jazz', icon: Disc3 },
  { id: 'lofi', label: 'Lofi', icon: Radio },
];

export function MusicPlayer() {
  const {
    genre, tracks, index, isPlaying, volume, status, error,
    loadGenre, toggle, next, prev, setVolume,
  } = useMusicStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const current = tracks[index];

  // Sync the <audio> element src with the current track.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.dataset.trackId !== current.id) {
      el.src = current.streamUrl;
      el.dataset.trackId = current.id;
    }
  }, [current]);

  // Drive play/pause from store state.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (isPlaying) {
      el.play().catch(() => { /* autoplay can be blocked until a user gesture */ });
    } else {
      el.pause();
    }
  }, [isPlaying, current]);

  // Keep element volume in sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cabin-panel/80 backdrop-blur-xl border border-gray-800 rounded-xl p-4"
    >
      <audio ref={audioRef} onEnded={next} preload="none" />

      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCollapsed((c) => !c)} className="flex items-center gap-2 group">
          <Music2 className="w-4 h-4 text-cabin-accent" />
          <span className="text-sm font-medium text-white">Focus Music</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cabin-accent"
          />
        </div>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {GENRES.map((g) => {
          const Icon = g.icon;
          const active = genre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => loadGenre(g.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                active
                  ? 'bg-cabin-accent/20 text-cabin-accent border-cabin-accent/40'
                  : 'bg-cabin-dim/40 text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {g.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {status === 'idle' && (
              <p className="text-[11px] text-gray-500">Pick a genre to stream quiet, instrumental focus music.</p>
            )}

            {status === 'loading' && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading tracks…
              </p>
            )}

            {status === 'error' && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Music unavailable{error ? ` (${error})` : ''}.
              </p>
            )}

            {status === 'ready' && current && (
              <div>
                <div className="mb-2 min-w-0">
                  <p className="text-sm text-white truncate">{current.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{current.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    className="w-7 h-7 rounded flex items-center justify-center bg-cabin-dim/40 text-gray-300 hover:text-white transition-colors"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggle}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-cabin-accent/20 text-cabin-accent hover:bg-cabin-accent/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={next}
                    className="w-7 h-7 rounded flex items-center justify-center bg-cabin-dim/40 text-gray-300 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <span className="ml-auto text-[10px] text-gray-600 font-mono">
                    {index + 1}/{tracks.length}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
