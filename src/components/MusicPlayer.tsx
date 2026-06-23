import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Play, Pause, SkipForward, SkipBack, Volume2, Loader2, AlertCircle,
  Piano, Disc3, Radio, Cloud, Waves, Film, Sliders,
} from 'lucide-react';
import { useMusicStore, type MusicGenre } from '@/store/musicStore';

const GENRES: { id: MusicGenre; label: string; icon: typeof Piano }[] = [
  { id: 'classical', label: 'Classical', icon: Piano },
  { id: 'jazz', label: 'Jazz', icon: Disc3 },
  { id: 'lofi', label: 'Lofi', icon: Radio },
  { id: 'ambient', label: 'Ambient', icon: Cloud },
  { id: 'electronic', label: 'Electronic', icon: Waves },
  { id: 'cinematic', label: 'Cinematic', icon: Film },
];

const EQ_BANDS = [
  { freq: 60, label: '60' },
  { freq: 170, label: '170' },
  { freq: 350, label: '350' },
  { freq: 1000, label: '1k' },
  { freq: 3500, label: '3.5k' },
  { freq: 8000, label: '8k' },
  { freq: 16000, label: '16k' },
] as const;

export function MusicPlayer() {
  const {
    genre, tracks, index, isPlaying, volume, status, error,
    loadGenre, toggle, next, prev, setVolume,
  } = useMusicStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [eqValues, setEqValues] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [showEq, setShowEq] = useState(false);

  const current = tracks[index];
  const [buffering, setBuffering] = useState(false);

  // Single effect: sync src + drive play/pause together to avoid race conditions.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;

    const trackChanged = el.dataset.trackId !== current.id;
    if (trackChanged) {
      el.src = current.streamUrl;
      el.dataset.trackId = current.id;
      el.load(); // start buffering immediately
      setBuffering(true);
    }

    if (isPlaying) {
      const tryPlay = (retries = 3) => {
        el.play().catch((err) => {
          if (err.name === 'AbortError' && retries > 0) {
            // Browser hasn't finished processing new src — retry shortly
            setTimeout(() => tryPlay(retries - 1), 300);
          }
          // NotAllowedError = autoplay blocked; user needs to click play
        });
      };
      tryPlay();
    } else {
      el.pause();
    }
  }, [current, isPlaying]);

  // Keep element volume in sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Apply EQ via Web Audio API filter chain — initialize once on mount.
  const eqRef = useRef<{ ctx: AudioContext; filters: BiquadFilterNode[] } | null>(null);
  const eqValuesRef = useRef(eqValues);
  eqValuesRef.current = eqValues;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const ctx = new AudioContext();
    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(el);
    } catch {
      // Source already created — can't create twice, abort.
      ctx.close();
      return;
    }

    const freqs = EQ_BANDS.map((b) => b.freq);
    const filters = freqs.map((freq, i) => {
      const f = ctx.createBiquadFilter();
      f.type = i === 0 ? 'lowshelf' : i === freqs.length - 1 ? 'highshelf' : 'peaking';
      f.frequency.value = freq;
      f.Q.value = 1;
      f.gain.value = eqValuesRef.current[i] ?? 0;
      return f;
    });

    source.connect(filters[0]);
    filters.reduce((a, b) => { a.connect(b); return b; });
    filters[filters.length - 1].connect(ctx.destination);
    eqRef.current = { ctx, filters };

    // Resume context on any user interaction (browsers suspend it by default).
    const resumeCtx = () => { void ctx.resume(); };
    document.addEventListener('click', resumeCtx);
    document.addEventListener('touchstart', resumeCtx);

    return () => {
      document.removeEventListener('click', resumeCtx);
      document.removeEventListener('touchstart', resumeCtx);
    };
  }, []);

  // Also resume the AudioContext when playback starts.
  useEffect(() => {
    if (isPlaying && eqRef.current?.ctx.state === 'suspended') {
      void eqRef.current.ctx.resume();
    }
  }, [isPlaying]);

  // Update filter gains when EQ values change.
  useEffect(() => {
    if (!eqRef.current) return;
    eqRef.current.filters.forEach((f, i) => {
      f.gain.value = eqValues[i] ?? 0;
    });
  }, [eqValues]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-h-0 flex flex-col bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-panel"
    >
      <audio
        ref={audioRef}
        onEnded={next}
        preload="auto"
        crossOrigin="anonymous"
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-cabin-accent" />
          <span className="text-sm font-medium text-white">Focus Music</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEq((s) => !s)}
            className={`p-1.5 rounded transition-all duration-200 ${showEq ? 'bg-cabin-accent/20 text-cabin-accent' : 'text-gray-400 hover:text-white'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <Volume2 className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cabin-accent"
          />
        </div>
      </div>

      {/* Genre chips */}
      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        {GENRES.map((g) => {
          const Icon = g.icon;
          const active = genre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => loadGenre(g.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 border ${
                active
                  ? 'bg-cabin-accent/20 text-cabin-accent border-cabin-accent/40 shadow-glow'
                  : 'bg-cabin-dim/40 text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Music2 className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-xs text-gray-500 max-w-[200px]">Pick a genre to stream quiet, instrumental focus music.</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-cabin-accent animate-spin mb-3" />
            <p className="text-xs text-gray-400">Loading tracks…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <AlertCircle className="w-8 h-8 text-amber-400/60 mb-3" />
            <p className="text-xs text-amber-400/90">Music unavailable{error ? ` (${error})` : ''}.</p>
            <p className="text-[10px] text-gray-600 mt-1">Available when deployed to Netlify.</p>
          </div>
        )}

        {status === 'ready' && current && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Track info — large display */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-4">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cabin-accent/30 to-cabin-dim/40 border border-white/[0.06] flex items-center justify-center mb-4 shadow-glow"
              >
                <Music2 className="w-8 h-8 text-cabin-accent/70" />
              </motion.div>
              <p className="text-sm font-medium text-white max-w-full truncate px-2">{current.title}</p>
              <p className="text-xs text-gray-500 max-w-full truncate px-2 mt-0.5">{current.artist}</p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-3 py-3 shrink-0">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-cabin-dim/40 text-gray-300 hover:text-white hover:bg-cabin-dim/60 transition-all duration-200"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={toggle}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-cabin-accent/20 text-cabin-accent hover:bg-cabin-accent/30 transition-all duration-200 shadow-glow"
              >
                {buffering ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button
                onClick={next}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-cabin-dim/40 text-gray-300 hover:text-white hover:bg-cabin-dim/60 transition-all duration-200"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center text-[10px] text-gray-600 font-mono shrink-0">
              {index + 1} / {tracks.length}
            </div>
          </div>
        )}
      </div>

      {/* 7-band EQ — pinned at bottom, sized like simulation controls */}
      <AnimatePresence>
        {showEq && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div className="pt-3 mt-3 border-t border-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Equalizer · Hz</span>
                <button
                  onClick={() => setEqValues([0, 0, 0, 0, 0, 0, 0])}
                  className="text-[10px] text-gray-500 hover:text-cabin-accent transition-colors"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {EQ_BANDS.map((band, i) => (
                  <div key={band.freq} className="flex flex-col items-center gap-1">
                    {/* Vertical slider column */}
                    <div className="relative h-16 flex items-center justify-center bg-cabin-dim/30 rounded">
                      {/* Center reference line */}
                      <div className="absolute inset-x-1 top-1/2 h-px bg-white/[0.08]" />
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqValues[i]}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setEqValues((prev) => {
                            const next = [...prev];
                            next[i] = v;
                            return next;
                          });
                        }}
                        className="eq-vertical-slider"
                        style={{
                          writingMode: 'vertical-lr' as const,
                          direction: 'rtl',
                          width: '100%',
                          height: '56px',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    {/* Hz label under each column */}
                    <span className="text-[9px] text-gray-500 font-mono leading-none">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
