import { get, set } from 'idb-keyval';
import type { AppData, CornFillEvent, HuntMarker } from './types';
import { MAP_LAYOUT_VERSION } from './mapConfig';
import { SUGGESTED_MARKERS, defaultSeason } from './suggestions';
import {
  DEFAULT_FULL_TO_EMPTY_DAYS,
  DEFAULT_CORN_WARN_MARGIN_DAYS,
} from './corn';

export const IDB_KEY = 'ranch-hunt-state';
export const LS_KEY = 'ranch-hunt-state';
export const ADMIN_SESSION_KEY = 'ranch-hunt-admin';
const DEFAULT_PIN = '1234';

export function defaultData(): AppData {
  const season = defaultSeason();
  const now = new Date().toISOString();
  return {
    version: 1,
    layoutVersion: MAP_LAYOUT_VERSION,
    pin: DEFAULT_PIN,
    markers: SUGGESTED_MARKERS.map((m) => ({ ...m })),
    seasons: [season],
    activeSeasonId: season.id,
    checkIns: [],
    harvests: [],
    hunterRoster: [],
    updatedAt: now,
    cornFillEvents: [],
    cornWarnDays: DEFAULT_FULL_TO_EMPTY_DAYS,
    cornWarnMarginDays: DEFAULT_CORN_WARN_MARGIN_DAYS,
    removedMarkerIds: [],
  };
}

function asEvents(raw: unknown): CornFillEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is CornFillEvent => {
    if (!e || typeof e !== 'object') return false;
    const ev = e as CornFillEvent;
    return (
      typeof ev.id === 'string' &&
      typeof ev.feederId === 'string' &&
      typeof ev.filledAt === 'string'
    );
  });
}

export function migrate(raw: unknown): AppData {
  const base = defaultData();
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Partial<AppData>;
  const storedLayout =
    typeof d.layoutVersion === 'number' ? d.layoutVersion : 0;
  const relayout = storedLayout < MAP_LAYOUT_VERSION;
  const markers: HuntMarker[] = relayout
    ? base.markers
    : Array.isArray(d.markers)
      ? d.markers
      : base.markers;
  const markerIds = new Set(markers.map((m) => m.id));
  const rawCheckIns = Array.isArray(d.checkIns) ? d.checkIns : [];
  const cornWarnDays =
    typeof d.cornWarnDays === 'number' && d.cornWarnDays > 0
      ? d.cornWarnDays
      : DEFAULT_FULL_TO_EMPTY_DAYS;
  const cornWarnMarginDays =
    typeof d.cornWarnMarginDays === 'number' && d.cornWarnMarginDays >= 0
      ? d.cornWarnMarginDays
      : DEFAULT_CORN_WARN_MARGIN_DAYS;
  return {
    version: 1,
    layoutVersion: MAP_LAYOUT_VERSION,
    pin: typeof d.pin === 'string' && d.pin.length > 0 ? d.pin : DEFAULT_PIN,
    markers,
    seasons:
      Array.isArray(d.seasons) && d.seasons.length > 0 ? d.seasons : base.seasons,
    activeSeasonId:
      typeof d.activeSeasonId === 'string' ? d.activeSeasonId : base.activeSeasonId,
    checkIns: relayout
      ? rawCheckIns.filter((c) => markerIds.has(c.markerId))
      : rawCheckIns,
    harvests: Array.isArray(d.harvests) ? d.harvests : [],
    hunterRoster: Array.isArray(d.hunterRoster) ? d.hunterRoster : [],
    updatedAt:
      typeof d.updatedAt === 'string' && d.updatedAt.length > 0
        ? d.updatedAt
        : base.updatedAt,
    cornFillEvents: asEvents(d.cornFillEvents),
    cornWarnDays,
    cornWarnMarginDays,
    removedMarkerIds: Array.isArray(d.removedMarkerIds)
      ? d.removedMarkerIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const fromIdb = await get(IDB_KEY);
    if (fromIdb) return migrate(fromIdb);
  } catch {
    /* IndexedDB may be blocked; fall through */
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return migrate(JSON.parse(raw) as unknown);
  } catch {
    /* ignore corrupt localStorage */
  }
  return defaultData();
}

export async function saveData(data: AppData): Promise<void> {
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(LS_KEY, json);
  } catch {
    /* quota / private mode */
  }
  try {
    await set(IDB_KEY, data);
  } catch {
    /* IndexedDB unavailable */
  }
}

export function parseImport(text: string): AppData {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup is not an object');
  }
  return migrate(parsed);
}

export function exportFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `ranch-hunt-backup-${yyyy}-${mm}-${dd}.json`;
}
