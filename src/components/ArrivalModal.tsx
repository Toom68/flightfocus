import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PlaneLanding, Loader2, Trophy, ArrowRight, BookOpen, type LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { useSavegameStore } from '@/store/savegameStore';
import { ACHIEVEMENTS_BY_ID } from '@/data/achievements';
import { CitySketch } from './CitySketch';
import { formatDistance, formatDuration } from '@/engine/simulation';

function iconByName(name: string): LucideIcon {
  const map = Icons as unknown as Record<string, LucideIcon>;
  return map[name] ?? Trophy;
}

export function ArrivalModal() {
  const {
    departure, arrival, route, sessionRealSeconds, cruiseRealSeconds, departedLocalHour,
    arrivalProcessed, markArrivalProcessed, setDeparture, returnToGrounded,
  } = useFlightStore();
  const { recordArrival, fillJournalEntry } = useSavegameStore();

  const activeSave = useSavegameStore((s) => s.saves.find((x) => x.id === s.activeSaveId));

  const [journalId, setJournalId] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || arrivalProcessed) return;
    if (!departure || !arrival) return;
    ranRef.current = true;

    const res = recordArrival({
      from: departure,
      to: arrival,
      ambientMinutes: sessionRealSeconds / 60,
      cruiseMinutes: cruiseRealSeconds / 60,
      departedLocalHour: departedLocalHour ?? undefined,
      distanceKm: route?.distance,
    });
    markArrivalProcessed();

    if (res) {
      setJournalId(res.journalId);
      setNewlyUnlocked(res.newlyUnlocked);
      void fillJournalEntry(res.journalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const journalEntry = journalId
    ? activeSave?.journalEntries.find((j) => j.id === journalId)
    : undefined;

  const handleContinue = () => {
    if (arrival) setDeparture(arrival);
    returnToGrounded();
  };

  if (!arrival) return null;

  const ambientMin = Math.round(sessionRealSeconds / 60);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22 }}
        className="w-full max-w-lg bg-cabin-panel border border-white/[0.08] rounded-2xl overflow-hidden max-h-[92vh] flex flex-col shadow-panel"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-cabin-accent/15 via-cabin-accent/5 to-transparent text-center relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cabin-accent/20 mb-2 shadow-glow">
            <PlaneLanding className="w-6 h-6 text-cabin-accent" />
          </div>
          <p className="text-xs uppercase tracking-wider text-gray-400">You've landed in</p>
          <h2 className="text-2xl font-bold text-white">{arrival.city}</h2>
          <p className="text-sm text-gray-400">{arrival.name}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span>{departure?.iata} → {arrival.iata}</span>
            {route && <span>{formatDistance(route.distance)}</span>}
            <span>{ambientMin >= 1 ? formatDuration(sessionRealSeconds) : '<1m'} in the air</span>
          </div>
        </div>

        <div className="px-5 pb-5 overflow-y-auto space-y-4">
          {/* Achievements */}
          {newlyUnlocked.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-cabin-gold flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Achievement{newlyUnlocked.length > 1 ? 's' : ''} unlocked
              </p>
              {newlyUnlocked.map((id, i) => {
                const a = ACHIEVEMENTS_BY_ID[id];
                if (!a) return null;
                const Icon = iconByName(a.icon);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-cabin-gold/10 border border-cabin-gold/30 shadow-glow-gold"
                  >
                    <div className="w-9 h-9 rounded-lg bg-cabin-gold/20 text-cabin-gold flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-[11px] text-gray-400">{a.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Journal entry about the city left behind */}
          <div className="bg-cabin-dim/40 border border-white/[0.04] rounded-xl p-4 shadow-soft">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-2">
              <BookOpen className="w-3 h-3" /> A page from {departure?.city}
            </p>
            <div className="flex gap-3">
              <div className="shrink-0 w-24 h-16 rounded-lg bg-cabin-dark/60 border border-white/[0.04] flex items-center justify-center text-cabin-accent/80">
                {journalEntry && <CitySketch sketchKey={journalEntry.svgKey} className="w-20 h-14" />}
              </div>
              <div className="flex-1 min-w-0">
                {!journalEntry || journalEntry.isGenerating ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Writing your journal…
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 italic leading-relaxed">{journalEntry.text}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3.5 bg-gradient-to-r from-cabin-accent to-blue-500 hover:shadow-glow text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            Continue in {arrival.city}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
