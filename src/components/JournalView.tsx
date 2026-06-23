import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, ArrowRight, ChevronDown, MapPin } from 'lucide-react';
import type { JournalEntry } from '@/types/savegame';
import { CitySketch } from './CitySketch';

interface JournalViewProps {
  entries: JournalEntry[];
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export function JournalView({ entries }: JournalViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <BookOpen className="w-7 h-7 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-500">Your journal is empty.</p>
        <p className="text-[10px] text-gray-600 mt-1">Complete a flight to write your first page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => {
        const isOpen = expandedId === entry.id;
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
          >
            <button
              onClick={() => setExpandedId(isOpen ? null : entry.id)}
              className={`w-full text-left rounded-lg border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-cabin-dim/50 border-white/[0.08]'
                  : 'bg-cabin-dim/20 border-white/[0.03] hover:bg-cabin-dim/35 hover:border-white/[0.06]'
              }`}
            >
              {/* Collapsed row: route + city + date */}
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="shrink-0 w-9 h-9 rounded-md bg-cabin-dark/60 border border-white/[0.04] flex items-center justify-center">
                  <CitySketch sketchKey={entry.svgKey} className="w-7 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono font-semibold text-white">{entry.fromAirport.iata}</span>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                    <span className="font-mono text-gray-400">{entry.toAirport.iata}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-600" />
                    <span className="text-[10px] text-gray-500 truncate">{entry.fromAirport.city}</span>
                  </div>
                </div>
                <span className="text-[9px] text-gray-600 font-mono shrink-0">{formatDate(entry.createdAt)}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Expanded content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.04]">
                      {entry.isGenerating ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Writing this page…
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 leading-relaxed italic pt-2">{entry.text}</p>
                      )}
                      {entry.isFallback && !entry.isGenerating && (
                        <p className="text-[9px] text-gray-600 mt-2">offline entry</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
