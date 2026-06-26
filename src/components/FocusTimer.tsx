import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, Play, Square, Maximize, Minimize2, Coffee, Plus, Check, X,
  Wind, Target, Flame, Clock,
} from 'lucide-react';
import { useFocusStore } from '@/store/focusStore';

interface Task {
  id: string;
  text: string;
  done: boolean;
}

const PRESETS = [
  { mins: 15, label: 'Quick' },
  { mins: 25, label: 'Pomodoro' },
  { mins: 45, label: 'Deep' },
  { mins: 90, label: 'Flow' },
];

const BREATHING_PHASES = [
  { label: 'Inhale', duration: 4, color: 'text-cabin-accent' },
  { label: 'Hold', duration: 4, color: 'text-cabin-gold' },
  { label: 'Exhale', duration: 6, color: 'text-blue-300' },
] as const;

export function FocusTimer() {
  const {
    isActive,
    timeRemaining,
    isBreak,
    sessionCount,
    sessions,
    isMinimalUI,
    startPomodoro,
    startCustomTimer,
    stopTimer,
    tick,
    toggleFullscreen,
    toggleMinimalUI,
  } = useFocusStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [breathing, setBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCount, setBreathCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => tick(1), 1000);
    return () => clearInterval(interval);
  }, [isActive, tick]);

  // Breathing animation cycle
  useEffect(() => {
    if (!breathing) return;
    const phase = BREATHING_PHASES[breathPhase];
    const timer = setTimeout(() => {
      const next = (breathPhase + 1) % BREATHING_PHASES.length;
      setBreathPhase(next);
      setBreathCount((c) => (next === 0 ? c + 1 : c));
    }, phase.duration * 1000);
    return () => clearTimeout(timer);
  }, [breathing, breathPhase]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = isBreak ? 5 * 60 : 25 * 60;
  const progress = isActive ? 1 - timeRemaining / totalDuration : 0;

  const completedSessions = sessions.filter((s) => s.endTime).length;
  const totalFocusMin = Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60);

  const addTask = () => {
    const text = taskInput.trim();
    if (!text) return;
    setTasks((t) => [...t, { id: Date.now().toString(), text, done: false }]);
    setTaskInput('');
  };

  const toggleTask = (id: string) =>
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

  const removeTask = (id: string) =>
    setTasks((t) => t.filter((task) => task.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:flex-1 lg:min-h-0 max-h-[70vh] lg:max-h-none flex flex-col bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-panel overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
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
            className="p-1.5 rounded hover:bg-white/5 text-gray-400 transition-colors"
          >
            {isMinimalUI ? <Maximize className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/5 text-gray-400 transition-colors"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Big timer display */}
      <div className="relative mb-4 shrink-0">
        <div className="text-center">
          <motion.span
            key={timeDisplay}
            className="text-5xl font-mono font-bold text-white tracking-wider drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
          >
            {timeDisplay}
          </motion.span>
        </div>
        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={`h-full rounded-full ${isBreak ? 'bg-gradient-to-r from-cabin-gold to-amber-300' : 'bg-gradient-to-r from-cabin-accent to-blue-400'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
        <div className="bg-cabin-dim/40 border border-white/[0.04] rounded-lg p-2 text-center">
          <Flame className="w-3 h-3 text-cabin-gold mx-auto mb-0.5" />
          <p className="text-sm font-mono text-white">{completedSessions}</p>
          <p className="text-[9px] text-gray-500">Sessions</p>
        </div>
        <div className="bg-cabin-dim/40 border border-white/[0.04] rounded-lg p-2 text-center">
          <Clock className="w-3 h-3 text-cabin-accent mx-auto mb-0.5" />
          <p className="text-sm font-mono text-white">{totalFocusMin}</p>
          <p className="text-[9px] text-gray-500">Minutes</p>
        </div>
        <div className="bg-cabin-dim/40 border border-white/[0.04] rounded-lg p-2 text-center">
          <Target className="w-3 h-3 text-blue-300 mx-auto mb-0.5" />
          <p className="text-sm font-mono text-white">{tasks.filter((t) => t.done).length}/{tasks.length}</p>
          <p className="text-[9px] text-gray-500">Tasks</p>
        </div>
      </div>

      {/* Timer controls */}
      <div className="shrink-0 mb-4">
        {!isActive ? (
          <div className="grid grid-cols-4 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.mins}
                onClick={() => p.mins === 25 ? startPomodoro() : startCustomTimer(p.mins)}
                className="py-2 px-1 bg-cabin-accent/15 hover:bg-cabin-accent/25 text-cabin-accent text-[10px] font-medium rounded-lg transition-all duration-200 hover:shadow-glow flex flex-col items-center gap-0.5"
              >
                <span className="font-mono font-bold text-xs">{p.mins}</span>
                <span className="text-[9px] opacity-70">{p.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={stopTimer}
            className="w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Square className="w-3 h-3" />
            End Session
          </button>
        )}
      </div>

      {/* Breathing exercise */}
      <div className="shrink-0 mb-4">
        <button
          onClick={() => { setBreathing(!breathing); setBreathPhase(0); setBreathCount(0); }}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
            breathing ? 'bg-cabin-accent/20 text-cabin-accent' : 'bg-cabin-dim/40 text-gray-400 hover:text-white'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          {breathing ? `Breathing · ${breathCount} cycles` : 'Box Breathing'}
        </button>
        <AnimatePresence>
          {breathing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center pt-4 pb-2">
                <motion.div
                  animate={{
                    scale: breathPhase === 0 ? [1, 1.4] : breathPhase === 2 ? [1.4, 1] : 1.4,
                    transition: { duration: BREATHING_PHASES[breathPhase].duration, ease: 'easeInOut' },
                  }}
                  className="w-16 h-16 rounded-full bg-cabin-accent/20 border-2 border-cabin-accent/40 flex items-center justify-center shadow-glow"
                >
                  <span className={`text-xs font-medium ${BREATHING_PHASES[breathPhase].color}`}>
                    {BREATHING_PHASES[breathPhase].label}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <Target className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-300">Tasks</span>
        </div>
        <div className="flex gap-1.5 mb-2 shrink-0">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a focus task…"
            className="flex-1 px-2.5 py-1.5 bg-cabin-dim/50 border border-white/[0.06] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cabin-accent/40 transition-all"
          />
          <button
            onClick={addTask}
            className="w-7 h-7 rounded-lg bg-cabin-accent/20 hover:bg-cabin-accent/30 text-cabin-accent flex items-center justify-center transition-all duration-200 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 group p-2 rounded-lg bg-cabin-dim/30 border border-white/[0.03] hover:border-white/[0.06] transition-all duration-200"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                  task.done ? 'bg-cabin-accent text-white' : 'border border-gray-600 hover:border-cabin-accent'
                }`}
              >
                {task.done && <Check className="w-3 h-3" />}
              </button>
              <span className={`flex-1 text-xs ${task.done ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                {task.text}
              </span>
              <button
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <p className="text-[11px] text-gray-600 text-center py-4">No tasks yet. Add one above.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
