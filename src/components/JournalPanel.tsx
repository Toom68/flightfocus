import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';
import { useSavegameStore } from '@/store/savegameStore';
import { JournalView } from './JournalView';

export function JournalPanel() {
  const save = useSavegameStore((s) => s.saves.find((x) => x.id === s.activeSaveId));
  const [collapsed, setCollapsed] = useState(true);

  if (!save) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-h-0 flex flex-col bg-cabin-panel/80 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-panel"
    >
      <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cabin-accent" />
          <span className="text-sm font-medium text-white">Journal</span>
          <span className="text-[10px] font-mono text-gray-500">{save.journalEntries.length}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 max-h-80 overflow-y-auto pr-1">
              <JournalView entries={save.journalEntries} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
