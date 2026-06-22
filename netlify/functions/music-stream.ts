import { Handler } from '@netlify/functions';

/**
 * Proxies the actual MP3 bytes for a Jamendo track through our own domain so
 * all music traffic stays on *.netlify.app (unblockable at school). Resolves
 * the track's streaming URL server-side from its id, then pipes the bytes back,
 * passing through Range headers so the <audio> element can seek/buffer.
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
    // Resolve the streaming URL for this track id.
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

    // Fetch the audio, passing through any Range header for seeking.
    const range = event.headers.range || event.headers.Range;
    const upstream = await fetch(audioUrl, range ? { headers: { Range: range } } : undefined);
    if (!upstream.ok && upstream.status !== 206) {
      throw new Error(`Audio fetch ${upstream.status}`);
    }

    const arrayBuf = await upstream.arrayBuffer();
    const body = Buffer.from(arrayBuf).toString('base64');

    const headers: Record<string, string> = {
      'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
      'Content-Length': String(arrayBuf.byteLength),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
    };
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) headers['Content-Range'] = contentRange;

    return {
      statusCode: upstream.status === 206 ? 206 : 200,
      headers,
      isBase64Encoded: true,
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: error instanceof Error ? error.message : 'Stream proxy failed',
    };
  }
};
