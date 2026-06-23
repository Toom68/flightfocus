import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function SimulationView() {
  const { tick, isActive, isPaused, phase } = useFlightStore();
  const { isMinimalUI } = useFocusStore();
  const lastTimeRef = useRef<number>(performance.now());
  const frameRef = useRef<number>(0);

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
          className="w-full lg:w-80 p-3 space-y-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/[0.04]"
        >
          <SimulationControls />
          <FocusTimer />
          <JournalPanel />
          <AudioMixer />
          <MusicPlayer />
        </motion.aside>
      )}

      <AnimatePresence>
        {phase === 'ARRIVED' && <ArrivalModal />}
      </AnimatePresence>
    </div>
  );
}
