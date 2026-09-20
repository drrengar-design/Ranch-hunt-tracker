import {
  DEFAULT_FULL_TO_EMPTY_DAYS,
  DEFAULT_CORN_WARN_MARGIN_DAYS,
  cornEvents,
} from './corn';
import type { AppData, CornFillEvent } from './types';

function stamp(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function itemTime(item: object): number {
  const rec = item as {
    updatedAt?: string;
    filledAt?: string;
    at?: string;
    outAt?: string;
  };
  return stamp(rec.updatedAt || rec.filledAt || rec.outAt || rec.at);
}

export function mergeById<T extends { id: string }>(left: T[], right: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of [...left, ...right]) {
    if (!item || typeof item.id !== 'string') continue;
    const prev = map.get(item.id);
    if (!prev || itemTime(item) >= itemTime(prev)) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function mergeRoster(a: string[], b: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const name of [...a, ...b]) {
    const trimmed = name.trim();
    const key = trimmed.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.slice(0, 24);
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Merge two ranch snapshots.
 *
 * - checkIns, harvests, markers, seasons, cornFillEvents: union by id;
 *   same id → later `updatedAt` (or filledAt/at) wins. Two devices adding
 *   different check-ins or fills both survive.
 * - Marker moves (x, y) ride on the marker record, so the later edit wins
 *   for that id; other markers are kept.
 * - Deletes: `removedMarkerIds` is a union.
 * - Scalars (pin, activeSeason, cornWarnDays, margin): last-write-wins on
 *   document `updatedAt`.
 */
export function mergeAppData(local: AppData, remote: AppData): AppData {
  const localNewer = stamp(local.updatedAt) >= stamp(remote.updatedAt);
  const winner = localNewer ? local : remote;
  const removed = uniqueIds([
    ...(local.removedMarkerIds ?? []),
    ...(remote.removedMarkerIds ?? []),
  ]);
  const markers = mergeById(local.markers ?? [], remote.markers ?? []).filter(
    (m) => !removed.includes(m.id),
  );
  const seasons = mergeById(local.seasons ?? [], remote.seasons ?? []);
  let activeSeasonId = winner.activeSeasonId;
  if (seasons.length > 0 && !seasons.some((s) => s.id === activeSeasonId)) {
    activeSeasonId = seasons[0].id;
  }
  const cornFillEvents = mergeById(
    cornEvents(local),
    cornEvents(remote),
  ).sort((a: CornFillEvent, b: CornFillEvent) =>
    b.filledAt.localeCompare(a.filledAt),
  );
  const updatedAt =
    stamp(local.updatedAt) >= stamp(remote.updatedAt)
      ? local.updatedAt
      : remote.updatedAt;

  return {
    version: 1,
    layoutVersion: Math.max(local.layoutVersion || 0, remote.layoutVersion || 0),
    pin: winner.pin,
    markers,
    seasons: seasons.length > 0 ? seasons : winner.seasons,
    activeSeasonId,
    checkIns: mergeById(local.checkIns ?? [], remote.checkIns ?? []),
    harvests: mergeById(local.harvests ?? [], remote.harvests ?? []),
    hunterRoster: mergeRoster(
      local.hunterRoster ?? [],
      remote.hunterRoster ?? [],
    ),
    updatedAt,
    cornFillEvents,
    cornWarnDays: winner.cornWarnDays ?? DEFAULT_FULL_TO_EMPTY_DAYS,
    cornWarnMarginDays:
      winner.cornWarnMarginDays ?? DEFAULT_CORN_WARN_MARGIN_DAYS,
    removedMarkerIds: removed,
  };
}

export function sameRanchPayload(a: AppData, b: AppData): boolean {
  return JSON.stringify(syncFingerprint(a)) === JSON.stringify(syncFingerprint(b));
}

function syncFingerprint(d: AppData) {
  return {
    pin: d.pin,
    layoutVersion: d.layoutVersion,
    activeSeasonId: d.activeSeasonId,
    markers: [...d.markers].sort((x, y) => x.id.localeCompare(y.id)),
    seasons: [...d.seasons].sort((x, y) => x.id.localeCompare(y.id)),
    checkIns: [...d.checkIns].sort((x, y) => x.id.localeCompare(y.id)),
    harvests: [...d.harvests].sort((x, y) => x.id.localeCompare(y.id)),
    hunterRoster: [...d.hunterRoster].map((n) => n.toLowerCase()).sort(),
    cornFillEvents: [...cornEvents(d)].sort((x, y) => x.id.localeCompare(y.id)),
    cornWarnDays: d.cornWarnDays,
    cornWarnMarginDays: d.cornWarnMarginDays,
    removedMarkerIds: [...(d.removedMarkerIds ?? [])].sort(),
  };
}
