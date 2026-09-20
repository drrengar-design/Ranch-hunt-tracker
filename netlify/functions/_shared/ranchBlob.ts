import { getStore } from '@netlify/blobs';
import type { Store } from '@netlify/blobs';
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

export function unwrap(raw: unknown): AppData {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const inner = (raw as { data: unknown }).data;
    if (inner && typeof inner === 'object' && 'markers' in (inner as object)) {
      return inner as AppData;
    }
  }
  return raw as AppData;
}

export async function resolveEtag(
  store: Store,
  maybe?: string,
): Promise<string> {
  if (maybe) return maybe;
  const meta = await store.getMetadata(RANCH_STATE_KEY);
  if (meta?.etag) return meta.etag;
  const listed = await store.list();
  const hit = listed.blobs.find((b) => b.key === RANCH_STATE_KEY);
  return hit?.etag ?? '';
}

export async function readState(): Promise<{ data: AppData; etag: string } | null> {
  const store = ranchStore();
  const result = await store.getWithMetadata(RANCH_STATE_KEY, { type: 'json' });
  if (!result || result.data == null) return null;
  const etag = await resolveEtag(store, result.etag);
  return { data: unwrap(result.data), etag };
}

export function syncBody(
  data: AppData,
  etag: string,
  extra?: Record<string, unknown>,
) {
  const status = extra?.error ? 409 : 200;
  const headers = etag ? { ETag: etag } : undefined;
  return jsonResponse({ data, etag, ...extra }, status, headers);
}

export type StoredEnvelope = { data: AppData };
