import { getStore } from '@netlify/blobs';
import type { AppData } from '../../src/types';

export const RANCH_STORE_NAME = 'ranch-hunt';
export const RANCH_STATE_KEY = 'state';
export const DEFAULT_RANCH_SYNC_SECRET = '1808';
export const SYNC_SECRET_HEADER = 'X-Ranch-Sync-Secret';

export function ranchStore() {
  return getStore({ name: RANCH_STORE_NAME, consistency: 'strong' });
}

function envGet(key: string): string | undefined {
  try {
    const netlify = (
      globalThis as {
        Netlify?: { env?: { get?: (name: string) => string | undefined } };
      }
    ).Netlify;
    const fromNetlify = netlify?.env?.get?.(key);
    if (typeof fromNetlify === 'string' && fromNetlify.length > 0) {
      return fromNetlify;
    }
  } catch {
    /* not running in Netlify runtime */
  }
  const fromProc = process.env[key];
  return fromProc && fromProc.length > 0 ? fromProc : undefined;
}

export function ranchSyncSecret(): string {
  return envGet('RANCH_SYNC_SECRET') ?? DEFAULT_RANCH_SYNC_SECRET;
}

export function requestSecret(req: Request): string {
  const header = req.headers.get(SYNC_SECRET_HEADER);
  if (header && header.trim()) return header.trim();
  const auth = req.headers.get('Authorization');
  if (auth && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, '').trim();
  }
  return '';
}

export function isAuthorized(req: Request): boolean {
  return requestSecret(req) === ranchSyncSecret();
}

export function jsonResponse(
  body: unknown,
  status: number,
  extra?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...Object.fromEntries(new Headers(extra).entries()),
    },
  });
}

export function unauthorized(): Response {
  return jsonResponse({ error: 'Unauthorized' }, 401);
}

export function methodNotAllowed(): Response {
  return jsonResponse({ error: 'Method not allowed' }, 405);
}

export type StoredEnvelope = { data: AppData };
