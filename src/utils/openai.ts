import type { Airport } from '@/types/airport';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export interface JournalGenerationResult {
  text: string;
  isFallback: boolean;
}

export function isLlmConfigured(): boolean {
  return typeof API_KEY === 'string' && API_KEY.length > 20;
}

function durationFlavour(ambientMinutes: number): string {
  if (ambientMinutes < 45) return 'They were only there briefly, barely time to settle in.';
  if (ambientMinutes < 240) return 'They spent a few unhurried hours there.';
  if (ambientMinutes < 600) return 'They spent the better part of a day there.';
  return 'They lingered there for a long, slow stretch of time.';
}

function timeOfDayHint(): string {
  const h = new Date().getHours();
  if (h < 6) return 'the small hours before dawn';
  if (h < 12) return 'the morning';
  if (h < 17) return 'the afternoon';
  if (h < 21) return 'the evening';
  return 'late at night';
}

/**
 * Local, deterministic-ish fallback used when the API key is missing or a
 * request fails. Produces a short, evocative paragraph from fragments.
 */
export function fallbackJournalEntry(from: Airport, to: Airport, ambientMinutes: number): string {
  const sensory = [
    `the smell of coffee and rain drifting through ${from.city}`,
    `the particular grey light over ${from.city} that afternoon`,
    `a street musician somewhere below the window in ${from.city}`,
    `the hum of ${from.city} settling into evening`,
    `the taste of something I couldn't name from a stall in ${from.city}`,
    `cold air and old stone in the older quarters of ${from.city}`,
    `the way the trams in ${from.city} cut the quiet`,
  ];
  const closers = [
    `Now ${to.city} is waiting, and I'm not quite ready to leave.`,
    `I packed slowly. ${to.city} can wait a few more minutes.`,
    `Onward to ${to.city}, headphones on, the world narrowing to a window seat.`,
    `${to.city} next. I always travel best with a little hum in my ears.`,
    `The gate to ${to.city} is calling. I leave a piece of ${from.city} behind.`,
  ];
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const dur = durationFlavour(ambientMinutes).toLowerCase();
  return `${capitalize(timeOfDayHint())} in ${from.city}, ${from.country}. ${capitalize(dur)} What stays with me is ${pick(sensory)}. ${pick(closers)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generates a short fictional travel-journal entry about the user's time in
 * `from`, as they set off for `to`. Falls back to a local template on any
 * failure so the UI never blocks.
 */
export async function generateJournalEntry(
  from: Airport,
  to: Airport,
  ambientMinutes: number
): Promise<JournalGenerationResult> {
  if (!isLlmConfigured()) {
    return { text: fallbackJournalEntry(from, to, ambientMinutes), isFallback: true };
  }

  const prompt = [
    `Write a short travel journal entry (3-4 evocative sentences, first person, past tense).`,
    `The narrator is a quiet remote worker who set up with headphones in ${from.city}, ${from.country} —`,
    `the kind of person who works from a cafe or hotel room and watches the city drift past.`,
    `${durationFlavour(ambientMinutes)} They are now flying onward to ${to.city}, ${to.country}.`,
    `Include exactly one specific sensory detail about ${from.city} — a smell, a sound, or a view from a window.`,
    `Avoid cliches and tourist-brochure language. Do not mention work, laptops, or productivity directly.`,
    `Keep it under 80 words. Return only the entry text, no title or quotation marks.`,
  ].join(' ');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a spare, literary travel diarist. You write brief, sensory, understated journal entries. No cliches, no exclamation marks, no lists.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 160,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`OpenAI ${res.status}`);
    }

    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('empty completion');

    return { text: stripWrappingQuotes(text), isFallback: false };
  } catch {
    return { text: fallbackJournalEntry(from, to, ambientMinutes), isFallback: true };
  }
}

function stripWrappingQuotes(s: string): string {
  return s.replace(/^["'\u201c\u2018]+/, '').replace(/["'\u201d\u2019]+$/, '').trim();
}
