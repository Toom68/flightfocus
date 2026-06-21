import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Square, Maximize, Minimize2, Coffee } from 'lucide-react';
import { useFocusStore } from '@/store/focusStore';

export function FocusTimer() {
  const {
    isActive,
    timeRemaining,
    isBreak,
    sessionCount,
    isMinimalUI,
    startPomodoro,
    startCustomTimer,
    stopTimer,
    tick,
    toggleFullscreen,
    toggleMinimalUI,
  } = useFocusStore();

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => tick(1), 1000);
    return () => clearInterval(interval);
  }, [isActive, tick]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = isActive
    ? 1 - timeRemaining / (isBreak ? 5 * 60 : 25 * 60)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cabin-panel/80 backdrop-blur-xl border border-gray-800 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="w-4 h-4 text-cabin-gold" />
          ) : (
            <Timer className="w-4 h-4 text-cabin-accent" />
          )}
          <span className="text-sm font-medium text-white">
            {isBreak ? 'Break' : 'Focus'}
          </span>
          {sessionCount > 0 && (
            <span className="text-xs text-gray-500">#{sessionCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimalUI}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 transition-colors"
          >
            {isMinimalUI ? <Maximize className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="text-center">
          <span className="text-4xl font-mono font-bold text-white tracking-wider">
            {timeDisplay}
          </span>
        </div>
        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isBreak ? 'bg-cabin-gold' : 'bg-cabin-accent'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {!isActive ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startPomodoro}
            className="py-2 px-3 bg-cabin-accent/20 hover:bg-cabin-accent/30 text-cabin-accent text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Play className="w-3 h-3" />
            Pomodoro
          </button>
          <button
            onClick={() => startCustomTimer(45)}
            className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
          >
            45 min
          </button>
        </div>
      ) : (
        <button
          onClick={stopTimer}
          className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Square className="w-3 h-3" />
          Stop
        </button>
      )}
    </motion.div>
  );
}
