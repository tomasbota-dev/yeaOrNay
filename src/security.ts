export class HttpError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) { super(message); }
}

export async function readBounded(request: Request, limit: number, message: string) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new HttpError(message, 413);
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > limit) { await reader.cancel(); throw new HttpError(message, 413); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError('Use JSON for this request.', 415);
  }
  const bytes = await readBounded(request, 12_000, 'That message is too long.');
  try {
    const result = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result;
  } catch { throw new HttpError('Please check the form and try again.', 400); }
}

type ChallengeEnv = { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string; LOCAL_TEST_MODE?: string };
export function localTestMode(request: Request, env: ChallengeEnv) {
  const url = new URL(request.url);
  return env.LOCAL_TEST_MODE === 'true' && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}
export function signupEnabled(request: Request, env: ChallengeEnv) {
  return localTestMode(request, env) || Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
}
export async function verifySignup(request: Request, env: ChallengeEnv, token: unknown) {
  if (localTestMode(request, env)) return;
  if (!signupEnabled(request, env)) throw new HttpError('Registration is temporarily unavailable. Please try again later.', 503);
  if (typeof token !== 'string' || !token || token.length > 2048) throw new HttpError('Complete the security check and try again.', 403);
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error();
    result = await response.json();
  } catch { throw new HttpError('Security check is temporarily unavailable. Please try again.', 503); }
  if (!result.success || result.hostname !== new URL(request.url).hostname || result.action !== 'signup') throw new HttpError('Complete the security check and try again.', 403);
}

// Parse image structure/dimensions without decoding attacker-controlled compressed pixels.
// This is validation, not sanitization/re-encoding. All images remain raster-only + nosniff.
export async function readImage(request: Request) {
  const type = request.headers.get('content-type') || '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new HttpError('Use a JPG, PNG, or WebP image.', 415);
  const bytes = await readBounded(request, 262144, 'Choose an image smaller than 256 KB.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  let width = 0, height = 0;
  if (type === 'image/png' && bytes.length >= 45 && ascii(0, 8) === '\x89PNG\r\n\x1a\n' && view.getUint32(8) === 13 && ascii(12, 4) === 'IHDR' && ascii(bytes.length - 8, 4) === 'IEND') {
    width = view.getUint32(16); height = view.getUint32(20);
  } else if (type === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes.at(-2) === 255 && bytes.at(-1) === 217) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 218 || marker === 217) break;
      const size = offset + 2 <= bytes.length ? view.getUint16(offset) : 0;
      if (size < 2 || offset + size > bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && size >= 8) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
      }
      offset += size;
    }
  } else if (type === 'image/webp' && bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP' && view.getUint32(4, true) + 8 === bytes.length) {
    const chunk = ascii(12, 4), size = view.getUint32(16, true);
    if (size + 20 <= bytes.length && chunk === 'VP8X' && size === 10) {
      // Reject animation; only a bounded still image is accepted.
      if (!(bytes[20] & 2)) {
        width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
        height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      }
    } else if (size + 20 <= bytes.length && chunk === 'VP8 ' && size >= 10 && ascii(23, 3) === '\x9d\x01\x2a') {
      width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff;
    } else if (size + 20 <= bytes.length && chunk === 'VP8L' && size >= 5 && bytes[20] === 47) {
      const bits = view.getUint32(21, true);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
    }
  }
  if (!width || !height) throw new HttpError('That file doesn’t look like a supported image.', 415);
  if (width > 2048 || height > 2048 || width * height > 4_000_000) throw new HttpError('Choose an image no larger than 2048 pixels and 4 megapixels.', 413);
  return { bytes, type };
}
