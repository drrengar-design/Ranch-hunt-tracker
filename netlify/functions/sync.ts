import type { Config, Context } from '@netlify/functions';
import {
  isAuthorized,
  jsonResponse,
  methodNotAllowed,
  ranchStore,
  RANCH_STATE_KEY,
  readState,
  resolveEtag,
  syncBody,
  unauthorized,
  unwrap,
  type StoredEnvelope,
} from './_shared/ranchBlob';

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: 'GET, PUT, POST, OPTIONS',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (!isAuthorized(req)) return unauthorized();

  if (req.method === 'GET') return handleGet();
  if (req.method === 'PUT' || req.method === 'POST') return handlePut(req);
  return methodNotAllowed();
};

export const config: Config = {
  path: '/api/sync',
  method: ['GET', 'PUT', 'POST', 'OPTIONS'],
};

async function handleGet(): Promise<Response> {
  const current = await readState();
  if (!current) return jsonResponse({ error: 'Empty' }, 404);
  return syncBody(current.data, current.etag);
}

async function handlePut(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const data = unwrap(body);
  if (!data || typeof data !== 'object') {
    return jsonResponse({ error: 'Expected { data }' }, 400);
  }

  const store = ranchStore();
  const ifMatch = req.headers.get('If-Match');
  const current = await readState();

  if (ifMatch) {
    const written = await store.setJSON(
      RANCH_STATE_KEY,
      { data } satisfies StoredEnvelope,
      { onlyIfMatch: ifMatch },
    );
    if (!written.modified) {
      const latest = await readState();
      if (!latest) return jsonResponse({ error: 'Conflict' }, 409);
      return syncBody(latest.data, latest.etag, { error: 'Conflict' });
    }
    const etag = written.etag || (await resolveEtag(store));
    return syncBody(data, etag);
  }

  if (current) {
    return syncBody(current.data, current.etag, { error: 'Conflict' });
  }

  const created = await store.setJSON(
    RANCH_STATE_KEY,
    { data } satisfies StoredEnvelope,
    { onlyIfNew: true },
  );
  if (!created.modified) {
    const latest = await readState();
    if (!latest) return jsonResponse({ error: 'Conflict' }, 409);
    return syncBody(latest.data, latest.etag, { error: 'Conflict' });
  }
  const etag = created.etag || (await resolveEtag(store));
  return syncBody(data, etag);
}
