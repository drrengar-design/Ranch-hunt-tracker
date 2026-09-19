import { get, set } from 'idb-keyval';
import type { AppData } from './types';
import { SUGGESTED_MARKERS, defaultSeason } from './suggestions';

export const IDB_KEY = 'ranch-hunt-state';
export const LS_KEY = 'ranch-hunt-state';
export const ADMIN_SESSION_KEY = 'ranch-hunt-admin';
const DEFAULT_PIN = '1234';

export function defaultData(): AppData {
  const season = defaultSeason();
  return {
    version: 1,
    pin: DEFAULT_PIN,
    markers: SUGGESTED_MARKERS.map((m) => ({ ...m })),
    seasons: [season],
    activeSeasonId: season.id,
    checkIns: [],
    harvests: [],
    hunterRoster: [],
  };
}

function migrate(raw: unknown): AppData {
  const base = defaultData();
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Partial<AppData>;
  return {
    version: 1,
    pin: typeof d.pin === 'string' && d.pin.length > 0 ? d.pin : DEFAULT_PIN,
    markers: Array.isArray(d.markers) ? d.markers : base.markers,
    seasons:
      Array.isArray(d.seasons) && d.seasons.length > 0 ? d.seasons : base.seasons,
    activeSeasonId:
      typeof d.activeSeasonId === 'string' ? d.activeSeasonId : base.activeSeasonId,
    checkIns: Array.isArray(d.checkIns) ? d.checkIns : [],
    harvests: Array.isArray(d.harvests) ? d.harvests : [],
    hunterRoster: Array.isArray(d.hunterRoster) ? d.hunterRoster : [],
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
