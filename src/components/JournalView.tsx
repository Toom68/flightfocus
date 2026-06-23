import { motion } from 'framer-motion';
import { BookOpen, Loader2, ArrowRight } from 'lucide-react';
import type { JournalEntry } from '@/types/savegame';
import { CitySketch } from './CitySketch';

interface JournalViewProps {
  entries: JournalEntry[];
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function JournalView({ entries }: JournalViewProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <BookOpen className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Your journal is empty.</p>
        <p className="text-xs text-gray-600 mt-1">Complete a flight and a page will write itself about the city you left behind.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <motion.article
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          className="bg-cabin-dim/40 border border-white/[0.04] rounded-xl p-4 shadow-soft"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono font-semibold text-white">{entry.fromAirport.iata}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="font-mono text-gray-400">{entry.toAirport.iata}</span>
            </div>
            <span className="text-[10px] text-gray-600">{formatDate(entry.createdAt)}</span>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-28 h-20 rounded-lg bg-cabin-dark/60 border border-white/[0.04] flex items-center justify-center text-cabin-accent/80">
              <CitySketch sketchKey={entry.svgKey} className="w-24 h-16" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{entry.fromAirport.city}, {entry.fromAirport.country}</p>
              {entry.isGenerating ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Writing this page…
                </div>
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed italic">{entry.text}</p>
              )}
              {entry.isFallback && !entry.isGenerating && (
                <p className="text-[10px] text-gray-600 mt-1.5">offline entry</p>
              )}
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
