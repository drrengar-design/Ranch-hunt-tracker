import { get, set } from 'idb-keyval';
import type { AppData, HuntMarker } from './types';
import { MAP_HEIGHT, MAP_REVISION, MAP_WIDTH } from './mapConfig';
import { SUGGESTED_MARKERS, defaultSeason } from './suggestions';

export const IDB_KEY = 'ranch-hunt-state';
export const LS_KEY = 'ranch-hunt-state';
export const ADMIN_SESSION_KEY = 'ranch-hunt-admin';
const DEFAULT_PIN = '1234';

export function defaultData(): AppData {
  const season = defaultSeason();
  return {
    version: 1,
    mapRevision: MAP_REVISION,
    pin: DEFAULT_PIN,
    markers: SUGGESTED_MARKERS.map((m) => ({ ...m })),
    seasons: [season],
    activeSeasonId: season.id,
    checkIns: [],
    harvests: [],
    hunterRoster: [],
  };
}

/** Default names from map revision 1 (portrait annotated map). */
const LEGACY_SUGGESTED_NAMES: Record<string, string> = {
  'blind-laguna-south': 'Laguna South',
  'blind-laguna-east': 'Laguna East',
  'blind-north-lane': 'North Lane',
  'blind-upper-fork': 'Upper Fork',
  'blind-east-junction': 'East Junction',
  'blind-center-lane': 'Center Lane',
  'blind-west-interior': 'West Interior',
  'blind-south-spine': 'South Spine',
  'blind-sw-corner': 'SW Corner',
  'blind-se-approach': 'SE Approach',
  'feeder-laguna': 'Laguna Feeder',
  'feeder-north': 'North Feeder',
  'feeder-upper-fork': 'Upper Fork Feeder',
  'feeder-east': 'East Feeder',
  'feeder-center': 'Center Feeder',
  'feeder-south': 'South Feeder',
  'feeder-sw': 'SW Feeder',
};

/** Re-place suggested pins after a map-image change; drop old-map custom pins that no longer fit. */
function remapMarkers(markers: HuntMarker[]): HuntMarker[] {
  const suggestedById = new Map(SUGGESTED_MARKERS.map((m) => [m.id, m]));
  const out: HuntMarker[] = [];
  const seen = new Set<string>();
  for (const m of markers) {
    const suggested = suggestedById.get(m.id);
    if (suggested) {
      const customName =
        typeof m.name === 'string' &&
        m.name.trim() &&
        m.name !== suggested.name &&
        m.name !== LEGACY_SUGGESTED_NAMES[m.id];
      out.push({
        ...suggested,
        name: customName ? m.name : suggested.name,
      });
      seen.add(m.id);
      continue;
    }
    if (
      typeof m.x === 'number' &&
      typeof m.y === 'number' &&
      m.x >= 0 &&
      m.y >= 0 &&
      m.x <= MAP_WIDTH &&
      m.y <= MAP_HEIGHT
    ) {
      out.push(m);
    }
  }
  for (const s of SUGGESTED_MARKERS) {
    if (!seen.has(s.id)) out.push({ ...s });
  }
  return out;
}

function migrate(raw: unknown): AppData {
  const base = defaultData();
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Partial<AppData> & { mapRevision?: number };
  const storedRevision =
    typeof d.mapRevision === 'number' ? d.mapRevision : 1;
  let markers: HuntMarker[] = Array.isArray(d.markers) ? d.markers : base.markers;
  if (storedRevision !== MAP_REVISION) {
    markers = remapMarkers(markers);
  }
  return {
    version: 1,
    mapRevision: MAP_REVISION,
    pin: typeof d.pin === 'string' && d.pin.length > 0 ? d.pin : DEFAULT_PIN,
    markers,
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
