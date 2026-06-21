/**
 * Minimal monochrome line-art "sketches" for cities, rendered inside a
 * <svg viewBox="0 0 120 80"> wrapper. Each value is the INNER markup only.
 * Use stroke="currentColor" fill="none" so the parent controls colour.
 *
 * Keyed primarily by IATA code; many airports in the same metro share a sketch
 * via CITY_ALIAS. Anything not covered falls back to GENERIC_SKETCH.
 */

const HORIZON = '<line x1="4" y1="68" x2="116" y2="68" stroke="currentColor" stroke-width="1.2"/>';

export const GENERIC_SKETCH = `
${HORIZON}
<path d="M40 52 L84 44 L86 48 L52 56 Z" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
<path d="M70 46 L78 34 L80 45" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
<path d="M58 51 L54 60 M64 49 L62 59" stroke="currentColor" stroke-width="1" fill="none"/>
<circle cx="98" cy="22" r="7" stroke="currentColor" stroke-width="1.1" fill="none"/>
`;

export const CITY_SKETCHES: Record<string, string> = {
  // Paris — Eiffel Tower
  CDG: `${HORIZON}
<path d="M60 14 L54 68 M60 14 L66 68" stroke="currentColor" stroke-width="1.3"/>
<path d="M56 40 L64 40 M53 54 L67 54 M50 68 L70 68" stroke="currentColor" stroke-width="1.1"/>
<path d="M57 27 L63 27" stroke="currentColor" stroke-width="1"/>
<path d="M54 68 Q60 60 66 68" stroke="currentColor" stroke-width="1"/>`,

  // London — Big Ben + bridge
  LHR: `${HORIZON}
<rect x="30" y="26" width="10" height="42" stroke="currentColor" stroke-width="1.2"/>
<path d="M30 26 L35 18 L40 26" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
<circle cx="35" cy="33" r="3" stroke="currentColor" stroke-width="1"/>
<path d="M58 68 L58 54 M58 54 Q72 42 86 54 L86 68" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M64 50 L64 68 M80 50 L80 68" stroke="currentColor" stroke-width="0.9"/>`,

  // Zurich — Alps + chalet
  ZRH: `${HORIZON}
<path d="M6 60 L34 28 L52 52 L74 22 L100 60" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
<path d="M70 27 L74 22 L78 27" stroke="currentColor" stroke-width="1"/>
<rect x="40" y="54" width="18" height="14" stroke="currentColor" stroke-width="1.1"/>
<path d="M40 54 L49 47 L58 54" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>`,

  // Rome — Colosseum
  FCO: `${HORIZON}
<path d="M30 40 Q60 30 90 40 L90 64 L30 64 Z" stroke="currentColor" stroke-width="1.3" fill="none"/>
<path d="M30 50 L90 50" stroke="currentColor" stroke-width="0.9"/>
<path d="M38 40 L38 64 M48 39 L48 64 M58 38 L58 64 M68 38 L68 64 M78 39 L78 64" stroke="currentColor" stroke-width="0.8"/>`,

  // Tokyo — Mt Fuji + tower
  HND: `${HORIZON}
<path d="M14 66 L40 30 L66 66" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
<path d="M32 38 L40 30 L48 38" stroke="currentColor" stroke-width="1"/>
<path d="M84 16 L78 66 M84 16 L90 66" stroke="currentColor" stroke-width="1.2"/>
<path d="M80 40 L88 40 M82 54 L86 54" stroke="currentColor" stroke-width="1"/>`,

  // Sydney — Opera House + harbour bridge
  SYD: `${HORIZON}
<path d="M24 66 Q34 40 44 66 M40 66 Q50 38 60 66 M56 66 Q66 42 76 66" stroke="currentColor" stroke-width="1.2" fill="none"/>
<path d="M84 66 L84 48 Q98 36 112 48 L112 66" stroke="currentColor" stroke-width="1.1" fill="none"/>`,

  // Dubai — Burj Khalifa spire
  DXB: `${HORIZON}
<path d="M58 8 L54 68 L66 68 L62 8 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
<path d="M55 30 L65 30 M56 46 L64 46 M57 58 L63 58" stroke="currentColor" stroke-width="0.8"/>
<path d="M60 8 L60 2" stroke="currentColor" stroke-width="1"/>
<rect x="74" y="44" width="8" height="24" stroke="currentColor" stroke-width="0.9"/>
<rect x="40" y="50" width="8" height="18" stroke="currentColor" stroke-width="0.9"/>`,

  // New York — skyline + Liberty
  JFK: `${HORIZON}
<rect x="30" y="34" width="9" height="34" stroke="currentColor" stroke-width="1"/>
<rect x="42" y="26" width="9" height="42" stroke="currentColor" stroke-width="1"/>
<rect x="54" y="40" width="9" height="28" stroke="currentColor" stroke-width="1"/>
<path d="M47 26 L47 20" stroke="currentColor" stroke-width="1"/>
<path d="M86 30 L82 68 L92 68 L88 30" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M87 30 L83 24 L91 24 Z" stroke="currentColor" stroke-width="1" fill="none"/>`,

  // Los Angeles — palms + hills
  LAX: `${HORIZON}
<path d="M14 64 Q44 50 74 56 Q94 60 106 52" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M40 66 L40 44 M40 44 Q32 40 28 44 M40 44 Q48 40 52 44 M40 44 Q34 36 40 34 M40 44 Q46 36 40 34" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M84 66 L84 46 M84 46 Q76 42 72 47 M84 46 Q92 42 96 47 M84 46 Q80 38 84 36" stroke="currentColor" stroke-width="1.1" fill="none"/>`,

  // San Francisco — Golden Gate
  SFO: `${HORIZON}
<path d="M20 68 L20 24 M96 68 L96 24" stroke="currentColor" stroke-width="1.3"/>
<path d="M20 24 L18 18 L22 18 Z M96 24 L94 18 L98 18 Z" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M4 40 Q58 58 112 40" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M4 48 L112 48" stroke="currentColor" stroke-width="1.1"/>
<path d="M34 49 L40 44 M52 50 L52 43 M70 50 L66 44 M84 49 L80 44" stroke="currentColor" stroke-width="0.7"/>`,

  // Singapore — Marina Bay Sands
  SIN: `${HORIZON}
<rect x="36" y="40" width="6" height="28" stroke="currentColor" stroke-width="1"/>
<rect x="58" y="36" width="6" height="32" stroke="currentColor" stroke-width="1"/>
<rect x="80" y="40" width="6" height="28" stroke="currentColor" stroke-width="1"/>
<path d="M30 34 L92 30 L92 36 L30 40 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>`,

  // Hong Kong — dense skyline + peak
  HKG: `${HORIZON}
<path d="M6 60 L26 40 L46 58" stroke="currentColor" stroke-width="1" fill="none"/>
<rect x="40" y="40" width="6" height="28" stroke="currentColor" stroke-width="0.9"/>
<rect x="49" y="30" width="6" height="38" stroke="currentColor" stroke-width="0.9"/>
<rect x="58" y="24" width="7" height="44" stroke="currentColor" stroke-width="1"/>
<rect x="68" y="36" width="6" height="32" stroke="currentColor" stroke-width="0.9"/>
<rect x="77" y="44" width="6" height="24" stroke="currentColor" stroke-width="0.9"/>
<path d="M61 24 L61 18" stroke="currentColor" stroke-width="0.9"/>`,

  // Amsterdam — canal houses + windmill
  AMS: `${HORIZON}
<path d="M30 68 L30 46 L36 40 L42 46 L42 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M44 68 L44 42 L50 36 L56 42 L56 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M58 68 L58 48 L64 42 L70 48 L70 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M90 68 L90 40" stroke="currentColor" stroke-width="1.2"/>
<path d="M90 40 L80 30 M90 40 L100 50 M90 40 L80 50 M90 40 L100 30" stroke="currentColor" stroke-width="1" fill="none"/>`,

  // Barcelona — Sagrada Familia
  BCN: `${HORIZON}
<path d="M44 68 L46 30 Q48 20 50 30 L52 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M54 68 L56 24 Q58 12 60 24 L62 68" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M64 68 L66 28 Q68 18 70 28 L72 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M74 68 L76 34 Q78 26 80 34 L82 68" stroke="currentColor" stroke-width="1" fill="none"/>`,

  // Istanbul — mosque + minarets
  IST: `${HORIZON}
<path d="M44 68 L44 48 Q60 32 76 48 L76 68 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
<path d="M60 32 L60 24" stroke="currentColor" stroke-width="1"/>
<path d="M34 68 L34 38 Q35 34 36 38 L36 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M84 68 L84 38 Q85 34 86 38 L86 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M35 34 L33 30 L37 30 Z M85 34 L83 30 L87 30 Z" stroke="currentColor" stroke-width="0.8" fill="none"/>`,

  // Bangkok — temple spire
  BKK: `${HORIZON}
<path d="M60 8 L52 68 L68 68 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
<path d="M56 44 L64 44 M54 54 L66 54 M58 32 L62 32" stroke="currentColor" stroke-width="0.8"/>
<path d="M60 8 L60 2" stroke="currentColor" stroke-width="0.9"/>
<path d="M44 68 L46 56 L50 68 M70 68 L74 56 L78 68" stroke="currentColor" stroke-width="0.9" fill="none"/>`,

  // Rio de Janeiro — Christ + Sugarloaf
  GIG: `${HORIZON}
<path d="M40 30 L40 50 M30 36 L50 36" stroke="currentColor" stroke-width="1.3"/>
<circle cx="40" cy="27" r="2.5" stroke="currentColor" stroke-width="1"/>
<path d="M30 64 Q40 50 50 64" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M72 66 Q84 40 96 66 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>`,

  // Cape Town — Table Mountain
  CPT: `${HORIZON}
<path d="M14 64 L30 40 L92 40 L106 64" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>
<path d="M30 40 Q60 36 92 40" stroke="currentColor" stroke-width="0.8" fill="none"/>`,

  // Honolulu — palm + sun + wave
  HNL: `${HORIZON}
<circle cx="92" cy="24" r="8" stroke="currentColor" stroke-width="1.1"/>
<path d="M34 66 L34 40 M34 40 Q24 34 18 40 M34 40 Q44 34 50 40 M34 40 Q28 30 34 28 M34 40 Q40 30 34 28" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M6 60 Q18 54 30 60 T54 60" stroke="currentColor" stroke-width="0.9" fill="none"/>`,

  // Frankfurt — modern towers
  FRA: `${HORIZON}
<rect x="40" y="22" width="10" height="46" stroke="currentColor" stroke-width="1"/>
<rect x="54" y="14" width="9" height="54" stroke="currentColor" stroke-width="1.1"/>
<rect x="67" y="32" width="9" height="36" stroke="currentColor" stroke-width="1"/>
<path d="M58 14 L58 8" stroke="currentColor" stroke-width="1"/>`,

  // Moscow — onion domes
  SVO: `${HORIZON}
<path d="M48 68 L48 44 L56 44 L56 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M48 44 Q52 30 56 44" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M52 30 L52 24" stroke="currentColor" stroke-width="0.9"/>
<path d="M64 68 L64 50 L72 50 L72 68" stroke="currentColor" stroke-width="1" fill="none"/>
<path d="M64 50 Q68 38 72 50" stroke="currentColor" stroke-width="1.1" fill="none"/>`,

  // Athens — Parthenon
  ATH: `${HORIZON}
<path d="M34 44 L86 44 L80 38 L40 38 Z" stroke="currentColor" stroke-width="1.1" fill="none"/>
<path d="M38 44 L38 64 M48 44 L48 64 M58 44 L58 64 M68 44 L68 64 M78 44 L78 64" stroke="currentColor" stroke-width="0.9"/>
<path d="M34 64 L86 64" stroke="currentColor" stroke-width="1.1"/>`,

  // Delhi — India Gate
  DEL: `${HORIZON}
<path d="M44 68 L44 36 Q60 22 76 36 L76 68" stroke="currentColor" stroke-width="1.3" fill="none"/>
<path d="M52 68 L52 40 M68 68 L68 40" stroke="currentColor" stroke-width="0.9"/>
<path d="M60 26 L60 20" stroke="currentColor" stroke-width="0.9"/>`,
};

// Secondary airports that share a city's sketch.
const CITY_ALIAS: Record<string, string> = {
  NRT: 'HND',
  LGW: 'LHR',
  LCY: 'LHR',
  EWR: 'JFK',
  LGA: 'JFK',
  GRU: 'GIG',
  MUC: 'FRA',
  LED: 'SVO',
};

export function getCitySketch(iata: string): string {
  const key = iata.toUpperCase();
  if (CITY_SKETCHES[key]) return CITY_SKETCHES[key];
  const alias = CITY_ALIAS[key];
  if (alias && CITY_SKETCHES[alias]) return CITY_SKETCHES[alias];
  return GENERIC_SKETCH;
}

export function getSketchKey(iata: string): string {
  const key = iata.toUpperCase();
  if (CITY_SKETCHES[key]) return key;
  if (CITY_ALIAS[key]) return CITY_ALIAS[key];
  return 'GENERIC';
}
