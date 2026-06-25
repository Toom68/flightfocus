import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, BookOpen, Trophy, Route, ChevronLeft, Navigation, Award } from 'lucide-react';
import { useSavegameStore } from '@/store/savegameStore';
import { useFlightStore } from '@/store/flightStore';
import type { Airport } from '@/types/airport';
import { getContinent } from '@/utils/geo';
import { getSketchKey } from '@/data/citySketchData';
import { CitySketch } from './CitySketch';
import { JournalView } from './JournalView';
import { LogbookView } from './LogbookView';
import { AchievementsPanel } from './AchievementsPanel';
import { AudioMixer } from './AudioMixer';
import { WorldMapPicker } from './WorldMapPicker';

type Tab = 'journal' | 'logbook' | 'achievements';

export function GroundedView() {
  const { getActiveSave, exitToHome } = useSavegameStore();
  const { setDeparture, setArrival, startFlight, setViewMode } = useFlightStore();
  const [tab, setTab] = useState<Tab>('logbook');
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = getActiveSave();

  if (!save) {
    // No active save — bounce back home.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => setViewMode('home')} className="text-cabin-accent text-sm">Return to menu</button>
      </div>
    );
  }

  const here = save.currentAirport;

  const handleExit = () => {
    exitToHome();
    setViewMode('home');
  };

  const handleSelectDestination = (dest: Airport) => {
    setDeparture(here);
    setArrival(dest);
    setPickerOpen(false);
    startFlight();
  };

  const tabs: { id: Tab; label: string; icon: typeof Plane }[] = [
    { id: 'logbook', label: 'Logbook', icon: Route },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={handleExit} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Journeys
          </button>
          <span className="text-sm text-gray-500 truncate max-w-[60%]">{save.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: hero + tabs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 shadow-panel"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-32 h-24 rounded-xl bg-cabin-dark/60 border border-white/[0.04] flex items-center justify-center text-cabin-accent/80 shadow-soft">
                  <CitySketch sketchKey={getSketchKey(here.iata)} className="w-28 h-20" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500">You are in</p>
                  <h1 className="text-2xl font-bold text-white truncate">{here.city}</h1>
                  <p className="text-sm text-gray-400 truncate">{here.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-mono">{here.iata}</span> · {getContinent(here)} · {here.country}
                  </p>
                  {save.stats.miles > 0 && (
                    <p className="text-xs mt-1.5 flex items-center gap-1.5 text-cabin-gold/80">
                      <Award className="w-3.5 h-3.5" />
                      <span className="font-mono text-cabin-gold">{save.stats.miles.toLocaleString()}</span>
                      <span className="text-gray-500">frequent flyer miles</span>
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setPickerOpen(true)}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-cabin-accent to-blue-500 hover:shadow-glow text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Choose your next destination
              </button>
            </motion.div>

            {/* Tabs */}
            <div className="bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 shadow-panel">
              <div className="flex gap-1 mb-4 bg-cabin-dim/40 rounded-lg p-1">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                      tab === t.id ? 'bg-cabin-accent text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[46vh] overflow-y-auto pr-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {tab === 'journal' && <JournalView entries={save.journalEntries} />}
                    {tab === 'logbook' && <LogbookView save={save} />}
                    {tab === 'achievements' && (
                      <AchievementsPanel unlocked={save.unlockedAchievements} unlockedAt={save.achievementUnlockedAt} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: ambient audio */}
          <div className="space-y-4">
            <AudioMixer />
            <p className="text-[11px] text-gray-600 px-1">
              The terminal hums quietly around you. Set your soundscape, then choose where the day takes you.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pickerOpen && (
          <WorldMapPicker from={here} onSelect={handleSelectDestination} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
