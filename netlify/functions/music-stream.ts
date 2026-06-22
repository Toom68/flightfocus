import { Handler } from '@netlify/functions';

/**
 * Resolves the Jamendo streaming URL for a track id and returns a 302 redirect.
 * The <audio> element follows the redirect and streams directly from Jamendo's
 * CDN, avoiding Netlify's 10s function timeout on large files.
 */
export const handler: Handler = async (event) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return { statusCode: 400, body: 'JAMENDO_CLIENT_ID not configured' };
  }

  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: 'Missing track id' };
  }

  try {
    const metaParams = new URLSearchParams({
      client_id: clientId,
      format: 'json',
      id,
      audioformat: 'mp32',
    });
    const metaRes = await fetch(`https://api.jamendo.com/v3.0/tracks/?${metaParams.toString()}`);
    if (!metaRes.ok) throw new Error(`Jamendo meta ${metaRes.status}`);
    const meta = await metaRes.json();
    const audioUrl: string | undefined = meta?.results?.[0]?.audio;
    if (!audioUrl) {
      return { statusCode: 404, body: 'Track not found' };
    }

    return {
      statusCode: 302,
      headers: {
        Location: audioUrl,
        'Cache-Control': 'public, max-age=3600',
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: error instanceof Error ? error.message : 'Stream redirect failed',
    };
  }
};
