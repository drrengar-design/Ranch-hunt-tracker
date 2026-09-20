import type { Config, Context } from '@netlify/functions';
import {
  isAuthorized,
  jsonResponse,
  methodNotAllowed,
  ranchStore,
  RANCH_STATE_KEY,
  unauthorized,
  type StoredEnvelope,
} from './_shared/ranchBlob';
import type { AppData } from '../../src/types';

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
  const store = ranchStore();
  const result = await store.getWithMetadata(RANCH_STATE_KEY, {
    type: 'json',
  });
  if (!result || result.data == null) {
    return jsonResponse({ error: 'Empty' }, 404);
  }
  const data = unwrap(result.data);
  return jsonResponse(
    { data, etag: result.etag },
    200,
    result.etag ? { ETag: result.etag } : undefined,
  );
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
  const current = await store.getWithMetadata(RANCH_STATE_KEY, {
    type: 'json',
  });

  if (ifMatch) {
    const written = await store.setJSON(RANCH_STATE_KEY, { data } satisfies StoredEnvelope, {
      onlyIfMatch: ifMatch,
    });
    if (!written.modified) {
      const latest = await store.getWithMetadata(RANCH_STATE_KEY, { type: 'json' });
      if (!latest || latest.data == null) {
        return jsonResponse({ error: 'Conflict' }, 409);
      }
      return jsonResponse(
        { data: unwrap(latest.data), etag: latest.etag, error: 'Conflict' },
        409,
        latest.etag ? { ETag: latest.etag } : undefined,
      );
    }
    return jsonResponse(
      { data, etag: written.etag },
      200,
      written.etag ? { ETag: written.etag } : undefined,
    );
  }

  if (current && current.data != null) {
    return jsonResponse(
      {
        data: unwrap(current.data),
        etag: current.etag,
        error: 'Conflict',
      },
      409,
      current.etag ? { ETag: current.etag } : undefined,
    );
  }

  const created = await store.setJSON(RANCH_STATE_KEY, { data } satisfies StoredEnvelope, {
    onlyIfNew: true,
  });
  if (!created.modified) {
    const latest = await store.getWithMetadata(RANCH_STATE_KEY, {
      type: 'json',
    });
    if (!latest || latest.data == null) {
      return jsonResponse({ error: 'Conflict' }, 409);
    }
    return jsonResponse(
      { data: unwrap(latest.data), etag: latest.etag, error: 'Conflict' },
      409,
      latest.etag ? { ETag: latest.etag } : undefined,
    );
  }
  return jsonResponse(
    { data, etag: created.etag },
    200,
    created.etag ? { ETag: created.etag } : undefined,
  );
}

function unwrap(raw: unknown): AppData {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const inner = (raw as { data: unknown }).data;
    if (inner && typeof inner === 'object' && 'markers' in (inner as object)) {
      return inner as AppData;
    }
  }
  return raw as AppData;
}
