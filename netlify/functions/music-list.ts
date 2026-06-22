import { Handler } from '@netlify/functions';

type Genre = 'classical' | 'jazz' | 'lofi';

// Handpicked, focus-friendly query profiles per genre: instrumental, low-energy.
const GENRE_QUERY: Record<Genre, { tags: string; fuzzytags: string }> = {
  classical: { tags: 'classical', fuzzytags: 'piano+ambient+instrumental' },
  jazz: { tags: 'jazz', fuzzytags: 'lounge+smooth+instrumental' },
  lofi: { tags: 'lofi', fuzzytags: 'chillout+downtempo+instrumental' },
};

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  license_ccurl: string;
}

export const handler: Handler = async (event) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'JAMENDO_CLIENT_ID not configured' }),
    };
  }

  const genreParam = (event.queryStringParameters?.genre || 'lofi').toLowerCase();
  const genre: Genre = (['classical', 'jazz', 'lofi'].includes(genreParam) ? genreParam : 'lofi') as Genre;
  const q = GENRE_QUERY[genre];

  // Start with minimal query to get any results, then add filters
  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: '30',
    order: 'popularity_month',
    include: 'musicinfo',
  });

  try {
    const apiUrl = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;
    console.log('Jamendo API URL:', apiUrl);
    const res = await fetch(apiUrl);
    console.log('Jamendo response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Jamendo error response:', errorText);
      throw new Error(`Jamendo ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    console.log('Jamendo response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    const results: JamendoTrack[] = data?.results ?? [];
    console.log('Tracks found:', results.length);

    const tracks = results.map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      duration: t.duration,
      license: t.license_ccurl,
      // Stream through our own proxy so the browser never touches Jamendo's CDN.
      streamUrl: `/.netlify/functions/music-stream?id=${encodeURIComponent(t.id)}`,
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      body: JSON.stringify({ genre, tracks }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Jamendo request failed' }),
    };
  }
};
