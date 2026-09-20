import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppData,
  CheckIn,
  GameSex,
  HarvestEntry,
  HuntMarker,
  MarkerKind,
  Season,
} from './types';
import { defaultData, loadData, saveData } from './storage';
import { SUGGESTED_MARKERS } from './suggestions';
import { MAP_REVISION } from './mapConfig';

function uid(): string {
  return crypto.randomUUID();
}

function rememberHunter(roster: string[], name: string): string[] {
  const n = name.trim();
  if (!n) return roster;
  return [n, ...roster.filter((h) => h.toLowerCase() !== n.toLowerCase())].slice(
    0,
    24,
  );
}

interface StoreValue {
  data: AppData;
  ready: boolean;
  occupantOf: (markerId: string) => CheckIn | undefined;
  activeSeason: Season | undefined;
  blinds: HuntMarker[];
  feeders: HuntMarker[];
  upsertMarker: (marker: HuntMarker) => void;
  addMarker: (kind: MarkerKind, x: number, y: number) => HuntMarker;
  moveMarker: (id: string, x: number, y: number) => void;
  deleteMarker: (id: string) => void;
  restoreSuggestions: () => void;
  addSeason: (partial?: Partial<Season>) => Season;
  updateSeason: (season: Season) => void;
  deleteSeason: (id: string) => void;
  setActiveSeason: (id: string) => void;
  checkIn: (markerId: string, hunterName: string) => void;
  checkOut: (markerId: string) => void;
  addHarvest: (entry: Omit<HarvestEntry, 'id'>) => void;
  updateHarvest: (entry: HarvestEntry) => void;
  deleteHarvest: (id: string) => void;
  setPin: (pin: string) => void;
  replaceAll: (next: AppData) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void loadData().then((loaded) => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
      skipSave.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void saveData(data);
    }, 180);
    return () => window.clearTimeout(t);
  }, [data, ready]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => fn(prev));
  }, []);

  const occupantOf = useCallback(
    (markerId: string) =>
      data.checkIns.find(
        (c) =>
          c.markerId === markerId &&
          c.seasonId === data.activeSeasonId &&
          !c.outAt,
      ),
    [data.checkIns, data.activeSeasonId],
  );

  const value = useMemo<StoreValue>(() => {
    const blinds = data.markers.filter((m) => m.kind === 'blind');
    const feeders = data.markers.filter((m) => m.kind === 'feeder');
    const activeSeason = data.seasons.find((s) => s.id === data.activeSeasonId);

    return {
      data,
      ready,
      occupantOf,
      activeSeason,
      blinds,
      feeders,
      upsertMarker: (marker) =>
        update((p) => ({
          ...p,
          markers: p.markers.some((m) => m.id === marker.id)
            ? p.markers.map((m) => (m.id === marker.id ? marker : m))
            : [...p.markers, marker],
        })),
      addMarker: (kind, x, y) => {
        const count = data.markers.filter((m) => m.kind === kind).length + 1;
        const marker: HuntMarker = {
          id: uid(),
          kind,
          name: `${kind === 'blind' ? 'Blind' : 'Feeder'} ${count}`,
          x,
          y,
          notes: '',
        };
        update((p) => ({ ...p, markers: [...p.markers, marker] }));
        return marker;
      },
      moveMarker: (id, x, y) =>
        update((p) => ({
          ...p,
          markers: p.markers.map((m) => (m.id === id ? { ...m, x, y } : m)),
        })),
      deleteMarker: (id) =>
        update((p) => ({
          ...p,
          markers: p.markers.filter((m) => m.id !== id),
          checkIns: p.checkIns.filter((c) => c.markerId !== id),
        })),
      restoreSuggestions: () =>
        update((p) => ({
          ...p,
          mapRevision: MAP_REVISION,
          markers: SUGGESTED_MARKERS.map((m) => ({ ...m })),
          checkIns: [],
        })),
      addSeason: (partial) => {
        const year = new Date().getFullYear();
        const season: Season = {
          id: uid(),
          name: partial?.name ?? `${year} Season`,
          startDate: partial?.startDate ?? `${year}-09-01`,
          endDate: partial?.endDate ?? `${year + 1}-01-31`,
        };
        update((p) => ({
          ...p,
          seasons: [...p.seasons, season],
          activeSeasonId: season.id,
        }));
        return season;
      },
      updateSeason: (season) =>
        update((p) => ({
          ...p,
          seasons: p.seasons.map((s) => (s.id === season.id ? season : s)),
        })),
      deleteSeason: (id) =>
        update((p) => {
          if (p.seasons.length <= 1) return p;
          const seasons = p.seasons.filter((s) => s.id !== id);
          const activeSeasonId =
            p.activeSeasonId === id ? seasons[0].id : p.activeSeasonId;
          return {
            ...p,
            seasons,
            activeSeasonId,
            checkIns: p.checkIns.filter((c) => c.seasonId !== id),
            harvests: p.harvests.filter((h) => h.seasonId !== id),
          };
        }),
      setActiveSeason: (id) => update((p) => ({ ...p, activeSeasonId: id })),
      checkIn: (markerId, hunterName) => {
        const name = hunterName.trim();
        if (!name) return;
        update((p) => {
          const now = new Date().toISOString();
          const closed = p.checkIns.map((c) =>
            c.markerId === markerId &&
            c.seasonId === p.activeSeasonId &&
            !c.outAt
              ? { ...c, outAt: now }
              : c,
          );
          const entry: CheckIn = {
            id: uid(),
            markerId,
            seasonId: p.activeSeasonId,
            hunterName: name,
            at: now,
          };
          return {
            ...p,
            checkIns: [...closed, entry],
            hunterRoster: rememberHunter(p.hunterRoster, name),
          };
        });
      },
      checkOut: (markerId) =>
        update((p) => {
          const now = new Date().toISOString();
          return {
            ...p,
            checkIns: p.checkIns.map((c) =>
              c.markerId === markerId &&
              c.seasonId === p.activeSeasonId &&
              !c.outAt
                ? { ...c, outAt: now }
                : c,
            ),
          };
        }),
      addHarvest: (entry) =>
        update((p) => ({
          ...p,
          harvests: [
            { ...entry, id: uid(), hunterName: entry.hunterName.trim() },
            ...p.harvests,
          ],
          hunterRoster: rememberHunter(p.hunterRoster, entry.hunterName),
        })),
      updateHarvest: (entry) =>
        update((p) => ({
          ...p,
          harvests: p.harvests.map((h) => (h.id === entry.id ? entry : h)),
        })),
      deleteHarvest: (id) =>
        update((p) => ({
          ...p,
          harvests: p.harvests.filter((h) => h.id !== id),
        })),
      setPin: (pin) => update((p) => ({ ...p, pin })),
      replaceAll: (next) => {
        skipSave.current = false;
        setData(next);
      },
      resetAll: () => {
        skipSave.current = false;
        setData(defaultData());
      },
    };
  }, [data, occupantOf, ready, update]);

  return createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const SEX_OPTIONS: { value: GameSex; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'buck', label: 'Buck' },
  { value: 'doe', label: 'Doe' },
  { value: 'boar', label: 'Boar' },
  { value: 'sow', label: 'Sow' },
];
