import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Plus, Trash2, MapPin, Clock, Trophy, ArrowRight, X } from 'lucide-react';
import { useSavegameStore, MAX_SAVES } from '@/store/savegameStore';
import { useFlightStore } from '@/store/flightStore';
import { useSpotifyStore } from '@/store/spotifyStore';
import { isSpotifyConfigured } from '@/utils/spotify';
import type { SaveGame } from '@/types/savegame';
import type { Airport } from '@/types/airport';
import { AirportSearch } from './AirportSearch';

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function formatHours(minutes: number): string {
  const h = minutes / 60;
  if (h < 1) return `${Math.round(minutes)}m`;
  return `${h.toFixed(1)}h`;
}

function uniqueAirportCount(save: SaveGame): number {
  return new Set(save.visitedAirports.map((v) => v.iata)).size;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function HomeScreen() {
  const { saves, createSave, loadSave, deleteSave } = useSavegameStore();
  const { setViewMode, setDeparture, setArrival } = useFlightStore();
  const { connected: spotifyConnected, connect: spotifyConnect, disconnect: spotifyDisconnect } = useSpotifyStore();
  const [showNew, setShowNew] = useState(false);

  const sortedSaves = useMemo(
    () => [...saves].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt),
    [saves]
  );

  const handleContinue = (save: SaveGame) => {
    loadSave(save.id);
    setDeparture(save.currentAirport);
    setArrival(null);
    setViewMode('grounded');
  };

  const handleCreate = (name: string, origin: Airport) => {
    createSave(name, origin);
    setDeparture(origin);
    setArrival(null);
    setShowNew(false);
    setViewMode('grounded');
  };

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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cabin-accent/10 border border-cabin-accent/20 mb-4 shadow-glow"
          >
            <Plane className="w-8 h-8 text-cabin-accent" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">flyandwork</h1>
          <p className="text-gray-400 text-sm">A quiet seat above the world. Pick up where you landed.</p>
        </div>

        <div className="bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-4 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Your journeys</h2>
            <span className="text-xs text-gray-500 font-mono">{saves.length}/{MAX_SAVES}</span>
          </div>

          {sortedSaves.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No journeys yet. Start a new one below.
            </div>
          )}

          <div className="space-y-2">
            {sortedSaves.map((save) => (
              <motion.div
                key={save.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 p-3 bg-cabin-dim/40 border border-white/[0.04] rounded-xl hover:border-cabin-accent/30 hover:shadow-soft transition-all duration-200"
              >
                <button onClick={() => handleContinue(save)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-cabin-accent/15 flex items-center justify-center shrink-0 shadow-glow">
                    <MapPin className="w-5 h-5 text-cabin-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{save.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      Currently in {save.currentAirport.city}
                      <span className="font-mono text-gray-500"> ({save.currentAirport.iata})</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{save.stats.totalFlights}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{uniqueAirportCount(save)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatHours(save.stats.totalAmbientMinutes)}</span>
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{save.unlockedAchievements.length}</span>
                      <span className="ml-auto">{relativeTime(save.lastPlayedAt)}</span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleContinue(save)}
                    className="w-9 h-9 rounded-lg bg-cabin-accent/20 text-cabin-accent flex items-center justify-center hover:bg-cabin-accent/30 transition-colors"
                    title="Continue journey"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSave(save.id)}
                    className="w-9 h-9 rounded-lg bg-gray-800/60 text-gray-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete journey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setShowNew(true)}
            disabled={saves.length >= MAX_SAVES}
            className="w-full py-3.5 bg-gradient-to-r from-cabin-accent to-blue-500 hover:shadow-glow disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:shadow-none text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Journey
          </button>
          {saves.length >= MAX_SAVES && (
            <p className="text-center text-[11px] text-gray-600">Delete a journey to start a new one.</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <p className="text-center text-xs text-gray-600">
            Where you land is where you take off next.
          </p>
          {isSpotifyConfigured() && (
            <button
              onClick={() => spotifyConnected ? spotifyDisconnect() : spotifyConnect()}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                spotifyConnected ? 'text-green-500/80 hover:text-green-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <SpotifyIcon className="w-3 h-3" />
              {spotifyConnected ? 'Spotify connected' : 'Connect Spotify'}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showNew && (
          <NewJourneyModal onClose={() => setShowNew(false)} onCreate={handleCreate} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface NewJourneyModalProps {
  onClose: () => void;
  onCreate: (name: string, origin: Airport) => void;
}

function NewJourneyModal({ onClose, onCreate }: NewJourneyModalProps) {
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [name, setName] = useState('');

  const defaultName = origin ? `Journey from ${origin.city}` : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cabin-panel border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-panel"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Start a new journey</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400">
          Choose where your story begins. You'll pick destinations as you go — each landing becomes your next departure.
        </p>

        <AirportSearch
          label="Starting airport"
          value={origin}
          onChange={setOrigin}
          placeholder="Search your home airport..."
        />

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Journey name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName || 'My grand tour'}
            className="w-full px-4 py-3 bg-cabin-dim/50 border border-white/[0.06] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cabin-accent/50 transition-all"
          />
        </div>

        <button
          onClick={() => origin && onCreate(name || defaultName, origin)}
          disabled={!origin}
          className="w-full py-3.5 bg-gradient-to-r from-cabin-accent to-blue-500 hover:shadow-glow disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:shadow-none text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plane className="w-5 h-5" />
          Begin
        </button>
      </motion.div>
    </motion.div>
  );
}
