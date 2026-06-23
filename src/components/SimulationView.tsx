import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Wand2, Music2, BookOpen } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { useFocusStore } from '@/store/focusStore';
import { WindowView } from './WindowView';
import { FlightMap } from './FlightMap';
import { FlightInfo } from './FlightInfo';
import { AudioMixer } from './AudioMixer';
import { MusicPlayer } from './MusicPlayer';
import { FocusTimer } from './FocusTimer';
import { SimulationControls } from './SimulationControls';
import { JournalPanel } from './JournalPanel';
import { ArrivalModal } from './ArrivalModal';

type SidebarTab = 'focus' | 'audio' | 'music' | 'journal';

const TABS: { id: SidebarTab; label: string; icon: typeof Timer }[] = [
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'audio', label: 'Sound', icon: Wand2 },
  { id: 'music', label: 'Music', icon: Music2 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
];

export function SimulationView() {
  const { tick, isActive, isPaused, phase } = useFlightStore();
  const { isMinimalUI } = useFocusStore();
  const lastTimeRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);
  const [activeTab, setActiveTab] = useState<SidebarTab>('focus');

  useEffect(() => {
    if (!isActive || isPaused) return;

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (delta < 1) {
        tick(delta);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, [isActive, isPaused, tick]);

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col p-3 gap-3 min-w-0">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
          <div className="min-h-[200px] lg:min-h-0">
            <WindowView />
          </div>
          <div className="min-h-[200px] lg:min-h-0">
            <FlightMap />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <FlightInfo />
        </motion.div>
      </div>

      {!isMinimalUI && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-80 p-3 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-white/[0.04] overflow-hidden"
        >
          <SimulationControls />

          {/* Tab bar */}
          <div className="flex gap-1 bg-cabin-dim/40 rounded-lg p-1 shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
                    active ? 'bg-cabin-accent/20 text-cabin-accent' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Active panel — fills remaining sidebar height */}
          <div className="flex-1 min-h-0 flex flex-col">
            {activeTab === 'focus' && <FocusTimer />}
            {activeTab === 'journal' && <JournalPanel />}
            {/* Audio + Music stay mounted but hidden to keep audio playing */}
            <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'audio' ? '' : 'hidden'}`}>
              <AudioMixer />
            </div>
            <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'music' ? '' : 'hidden'}`}>
              <MusicPlayer />
            </div>
          </div>
        </motion.aside>
      )}

      <AnimatePresence>
        {phase === 'ARRIVED' && <ArrivalModal />}
      </AnimatePresence>
    </div>
  );
}
