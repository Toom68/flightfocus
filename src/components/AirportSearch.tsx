import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plane, MapPin } from 'lucide-react';
import type { Airport } from '@/types/airport';
import { searchAirports } from '@/utils/search';

interface AirportSearchProps {
  label: string;
  value: Airport | null;
  onChange: (airport: Airport) => void;
  placeholder?: string;
}

export function AirportSearch({ label, value, onChange, placeholder = 'Search airport...' }: AirportSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReturnType<typeof searchAirports>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0) {
      const searchResults = searchAirports(query, 8);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].airport);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </label>

      {value ? (
        <div
          className="flex items-center gap-3 p-3 bg-cabin-dim/50 border border-white/[0.06] rounded-lg cursor-pointer hover:border-cabin-accent/50 transition-all duration-200"
          onClick={() => {
            onChange(null as unknown as Airport);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-cabin-accent/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-cabin-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{value.iata}</span>
              <span className="text-xs text-gray-500">{value.icao}</span>
            </div>
            <p className="text-sm text-gray-400 truncate">{value.city}, {value.country}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-cabin-dim/50 border border-white/[0.06] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cabin-accent/50 focus:ring-1 focus:ring-cabin-accent/20 transition-all"
          />
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-cabin-panel border border-white/[0.08] rounded-lg shadow-panel overflow-hidden"
          >
            {results.map((result, index) => (
              <button
                key={result.airport.iata}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-cabin-accent/10 border-l-2 border-cabin-accent'
                    : 'hover:bg-cabin-dim/50 border-l-2 border-transparent'
                }`}
                onClick={() => handleSelect(result.airport)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-white text-sm">{result.airport.iata}</span>
                    <span className="text-xs text-gray-500">{result.airport.icao}</span>
                    <span className="text-xs text-gray-600 ml-auto">{result.matchField}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {result.airport.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.airport.city}, {result.airport.country}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
