import { migrate } from './storage';
import type { AppData } from './types';

export const SYNC_PATH = '/api/sync';
export const SYNC_SECRET_LS_KEY = 'ranch-hunt-sync-secret';
export const DEFAULT_RANCH_SYNC_SECRET = '1808';
export const SYNC_POLL_MS = 4000;
export const SYNC_SECRET_HEADER = 'X-Ranch-Sync-Secret';

export function getSyncSecret(): string {
  const fromEnv = import.meta.env.VITE_RANCH_SYNC_SECRET;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  try {
    const stored = localStorage.getItem(SYNC_SECRET_LS_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch {
    /* private mode */
  }
  return DEFAULT_RANCH_SYNC_SECRET;
}

export function setStoredSyncSecret(secret: string): void {
  try {
    const trimmed = secret.trim();
    if (trimmed) localStorage.setItem(SYNC_SECRET_LS_KEY, trimmed);
    else localStorage.removeItem(SYNC_SECRET_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function hasBakedSyncSecret(): boolean {
  const fromEnv = import.meta.env.VITE_RANCH_SYNC_SECRET;
  return typeof fromEnv === 'string' && fromEnv.trim().length > 0;
}

function secretHeaders(etag?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [SYNC_SECRET_HEADER]: getSyncSecret(),
  };
  if (etag) headers['If-Match'] = etag;
  return headers;
}

export type PullResult =
  | { kind: 'ok'; data: AppData; etag: string }
  | { kind: 'empty' }
  | { kind: 'offline' }
  | { kind: 'unauthorized' }
  | { kind: 'error'; message: string };

export type PushResult =
  | { kind: 'ok'; etag: string }
  | { kind: 'conflict'; data: AppData; etag: string }
  | { kind: 'offline' }
  | { kind: 'unauthorized' }
  | { kind: 'error'; message: string };

function parseEnvelope(
  json: unknown,
  etagHeader: string | null,
): { data: AppData; etag: string } | null {
  if (!json || typeof json !== 'object') return null;
  const body = json as { data?: unknown; etag?: unknown };
  const raw = body.data ?? json;
  const data = migrate(raw);
  const etag =
    (typeof body.etag === 'string' && body.etag) || etagHeader || '';
  if (!etag) return null;
  return { data, etag };
}

export async function pullRemote(): Promise<PullResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { kind: 'offline' };
  }
  try {
    const res = await fetch(SYNC_PATH, {
      method: 'GET',
      headers: secretHeaders(),
      cache: 'no-store',
    });
    if (res.status === 401 || res.status === 403) return { kind: 'unauthorized' };
    if (res.status === 404) return { kind: 'empty' };
    if (!res.ok) {
      return { kind: 'error', message: `GET ${res.status}` };
    }
    const json: unknown = await res.json();
    const parsed = parseEnvelope(json, res.headers.get('ETag'));
    if (!parsed) return { kind: 'empty' };
    return { kind: 'ok', data: parsed.data, etag: parsed.etag };
  } catch {
    return { kind: 'offline' };
  }
}

export async function pushRemote(
  data: AppData,
  etag?: string | null,
): Promise<PushResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { kind: 'offline' };
  }
  try {
    const res = await fetch(SYNC_PATH, {
      method: 'PUT',
      headers: {
        ...secretHeaders(etag),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ data }),
    });
    if (res.status === 401 || res.status === 403) return { kind: 'unauthorized' };
    if (res.status === 409) {
      const json: unknown = await res.json().catch(() => null);
      const parsed = parseEnvelope(json, res.headers.get('ETag'));
      if (!parsed) {
        return { kind: 'error', message: 'Conflict with no body' };
      }
      return { kind: 'conflict', data: parsed.data, etag: parsed.etag };
    }
    if (!res.ok) {
      return { kind: 'error', message: `PUT ${res.status}` };
    }
    const json: unknown = await res.json().catch(() => null);
    const parsed = parseEnvelope(json, res.headers.get('ETag'));
    const nextEtag = parsed?.etag || res.headers.get('ETag') || etag || '';
    if (!nextEtag) return { kind: 'error', message: 'Missing ETag' };
    return { kind: 'ok', etag: nextEtag };
  } catch {
    return { kind: 'offline' };
  }
}
