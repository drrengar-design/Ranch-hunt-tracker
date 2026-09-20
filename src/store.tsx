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
  CornFillEvent,
  GameSex,
  HarvestEntry,
  HuntMarker,
  MarkerKind,
  Season,
  SyncStatus,
} from './types';
import { MAP_LAYOUT_VERSION } from './mapConfig';
import { defaultData, loadData, saveData } from './storage';
import { SUGGESTED_MARKERS } from './suggestions';
import { cornEvents, defaultFeederDurationDays } from './corn';
import { mergeAppData, sameRanchPayload } from './syncMerge';
import { pullRemote, pushRemote, SYNC_POLL_MS } from './sync';

function uid(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
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
  syncStatus: SyncStatus;
  syncDetail: string;
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
  markCornFilled: (feederId: string, by?: string, notes?: string) => void;
  setFeederDuration: (feederId: string, days: number) => void;
  setCornDefaults: (fullToEmptyDays: number, marginDays: number) => void;
  setPin: (pin: string) => void;
  replaceAll: (next: AppData) => void;
  resetAll: () => void;
  refreshSync: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncDetail, setSyncDetail] = useState('');
  const skipSave = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;
  const etagRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);
  const pushingRef = useRef(false);
  const startedRef = useRef(false);

  const applyLocal = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      const stamped = { ...next, updatedAt: nowISO() };
      dataRef.current = stamped;
      return stamped;
    });
    dirtyRef.current = true;
  }, []);

  const applyMerged = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const pushNow = useCallback(async (payload?: AppData) => {
    if (pushingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      setSyncDetail('Waiting for network');
      return;
    }
    pushingRef.current = true;
    setSyncStatus('syncing');
    setSyncDetail('');
    try {
      let current = payload ?? dataRef.current;
      for (let attempt = 0; attempt < 5; attempt++) {
        const result = await pushRemote(current, etagRef.current);
        if (result.kind === 'ok') {
          etagRef.current = result.etag;
          if (dataRef.current.updatedAt === current.updatedAt) {
            dirtyRef.current = false;
          }
          setSyncStatus('live');
          setSyncDetail('');
          if (dirtyRef.current) {
            current = dataRef.current;
            continue;
          }
          return;
        }
        if (result.kind === 'conflict') {
          const merged = mergeAppData(current, result.data);
          etagRef.current = result.etag;
          current = { ...merged, updatedAt: nowISO() };
          applyMerged(current);
          dirtyRef.current = true;
          continue;
        }
        if (result.kind === 'offline') {
          setSyncStatus('offline');
          setSyncDetail('Waiting for network');
          return;
        }
        if (result.kind === 'unauthorized') {
          setSyncStatus('error');
          setSyncDetail('Ranch sync secret rejected');
          return;
        }
        setSyncStatus('error');
        setSyncDetail(result.message);
        return;
      }
    } finally {
      pushingRef.current = false;
    }
  }, [applyMerged]);

  const pullMergePush = useCallback(async () => {
    const pulled = await pullRemote();
    if (pulled.kind === 'offline') {
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
      setSyncDetail(navigator.onLine ? 'Sync unreachable' : 'Waiting for network');
      return;
    }
    if (pulled.kind === 'unauthorized') {
      setSyncStatus('error');
      setSyncDetail('Ranch sync secret rejected');
      return;
    }
    if (pulled.kind === 'error') {
      setSyncStatus('error');
      setSyncDetail(pulled.message);
      return;
    }
    if (pulled.kind === 'empty') {
      dirtyRef.current = true;
      await pushNow(dataRef.current);
      return;
    }
    if (pulled.etag === etagRef.current && !dirtyRef.current) {
      setSyncStatus('live');
      setSyncDetail('');
      return;
    }
    const merged = mergeAppData(dataRef.current, pulled.data);
    etagRef.current = pulled.etag;
    if (!sameRanchPayload(merged, dataRef.current)) {
      applyMerged(merged);
    }
    const needPush =
      dirtyRef.current || !sameRanchPayload(merged, pulled.data);
    if (needPush) {
      dirtyRef.current = true;
      await pushNow(merged);
    } else {
      setSyncStatus('live');
      setSyncDetail('');
    }
  }, [applyMerged, pushNow]);

  useEffect(() => {
    let cancelled = false;
    void loadData().then(async (loaded) => {
      if (cancelled) return;
      dataRef.current = loaded;
      setData(loaded);
      setReady(true);
      skipSave.current = true;
      await pullMergePush();
      startedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [pullMergePush]);

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

  useEffect(() => {
    if (!ready) return;
    const onTick = () => {
      if (document.visibilityState === 'hidden') return;
      void pullMergePush();
    };
    const onOnline = () => {
      setSyncStatus('syncing');
      void pullMergePush();
    };
    const onOffline = () => {
      setSyncStatus('offline');
      setSyncDetail('Waiting for network');
    };
    const id = window.setInterval(onTick, SYNC_POLL_MS);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onTick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onTick);
    };
  }, [pullMergePush, ready]);

  useEffect(() => {
    if (!ready || !startedRef.current) return;
    if (!dirtyRef.current) return;
    const t = window.setTimeout(() => {
      void pushNow();
    }, 280);
    return () => window.clearTimeout(t);
  }, [data, pushNow, ready]);

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
      syncStatus,
      syncDetail,
      occupantOf,
      activeSeason,
      blinds,
      feeders,
      upsertMarker: (marker) =>
        applyLocal((p) => ({
          ...p,
          markers: p.markers.some((m) => m.id === marker.id)
            ? p.markers.map((m) =>
                m.id === marker.id ? { ...marker, updatedAt: nowISO() } : m,
              )
            : [...p.markers, { ...marker, updatedAt: nowISO() }],
          removedMarkerIds: (p.removedMarkerIds ?? []).filter(
            (id) => id !== marker.id,
          ),
        })),
      addMarker: (kind, x, y) => {
        const count = data.markers.filter((m) => m.kind === kind).length + 1;
        const stamp = nowISO();
        const marker: HuntMarker = {
          id: uid(),
          kind,
          name: `${kind === 'blind' ? 'Blind' : 'Feeder'} ${count}`,
          x,
          y,
          notes: '',
          updatedAt: stamp,
          fullToEmptyDays:
            kind === 'feeder' ? defaultFeederDurationDays(data) : undefined,
        };
        applyLocal((p) => ({
          ...p,
          markers: [...p.markers, marker],
          removedMarkerIds: (p.removedMarkerIds ?? []).filter(
            (id) => id !== marker.id,
          ),
        }));
        return marker;
      },
      moveMarker: (id, x, y) =>
        applyLocal((p) => ({
          ...p,
          markers: p.markers.map((m) =>
            m.id === id ? { ...m, x, y, updatedAt: nowISO() } : m,
          ),
        })),
      deleteMarker: (id) =>
        applyLocal((p) => ({
          ...p,
          markers: p.markers.filter((m) => m.id !== id),
          checkIns: p.checkIns.filter((c) => c.markerId !== id),
          removedMarkerIds: [...new Set([...(p.removedMarkerIds ?? []), id])],
        })),
      restoreSuggestions: () =>
        applyLocal((p) => {
          const suggestedIds = new Set(SUGGESTED_MARKERS.map((m) => m.id));
          const customIds = p.markers
            .filter((m) => !suggestedIds.has(m.id))
            .map((m) => m.id);
          const stamp = nowISO();
          return {
            ...p,
            layoutVersion: MAP_LAYOUT_VERSION,
            markers: SUGGESTED_MARKERS.map((m) => ({ ...m, updatedAt: stamp })),
            checkIns: [],
            removedMarkerIds: [
              ...new Set(
                [...(p.removedMarkerIds ?? []), ...customIds].filter(
                  (id) => !suggestedIds.has(id),
                ),
              ),
            ],
          };
        }),
      addSeason: (partial) => {
        const year = new Date().getFullYear();
        const season: Season = {
          id: uid(),
          name: partial?.name ?? `${year} Season`,
          startDate: partial?.startDate ?? `${year}-09-01`,
          endDate: partial?.endDate ?? `${year + 1}-01-31`,
          updatedAt: nowISO(),
        };
        applyLocal((p) => ({
          ...p,
          seasons: [...p.seasons, season],
          activeSeasonId: season.id,
        }));
        return season;
      },
      updateSeason: (season) =>
        applyLocal((p) => ({
          ...p,
          seasons: p.seasons.map((s) =>
            s.id === season.id ? { ...season, updatedAt: nowISO() } : s,
          ),
        })),
      deleteSeason: (id) =>
        applyLocal((p) => {
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
      setActiveSeason: (id) => applyLocal((p) => ({ ...p, activeSeasonId: id })),
      checkIn: (markerId, hunterName) => {
        const name = hunterName.trim();
        if (!name) return;
        applyLocal((p) => {
          const now = nowISO();
          const closed = p.checkIns.map((c) =>
            c.markerId === markerId &&
            c.seasonId === p.activeSeasonId &&
            !c.outAt
              ? { ...c, outAt: now, updatedAt: now }
              : c,
          );
          const entry: CheckIn = {
            id: uid(),
            markerId,
            seasonId: p.activeSeasonId,
            hunterName: name,
            at: now,
            updatedAt: now,
          };
          return {
            ...p,
            checkIns: [...closed, entry],
            hunterRoster: rememberHunter(p.hunterRoster, name),
          };
        });
      },
      checkOut: (markerId) =>
        applyLocal((p) => {
          const now = nowISO();
          return {
            ...p,
            checkIns: p.checkIns.map((c) =>
              c.markerId === markerId &&
              c.seasonId === p.activeSeasonId &&
              !c.outAt
                ? { ...c, outAt: now, updatedAt: now }
                : c,
            ),
          };
        }),
      addHarvest: (entry) =>
        applyLocal((p) => ({
          ...p,
          harvests: [
            {
              ...entry,
              id: uid(),
              hunterName: entry.hunterName.trim(),
              updatedAt: nowISO(),
            },
            ...p.harvests,
          ],
          hunterRoster: rememberHunter(p.hunterRoster, entry.hunterName),
        })),
      updateHarvest: (entry) =>
        applyLocal((p) => ({
          ...p,
          harvests: p.harvests.map((h) =>
            h.id === entry.id ? { ...entry, updatedAt: nowISO() } : h,
          ),
        })),
      deleteHarvest: (id) =>
        applyLocal((p) => ({
          ...p,
          harvests: p.harvests.filter((h) => h.id !== id),
        })),
      markCornFilled: (feederId, by, notes) =>
        applyLocal((p) => {
          const event: CornFillEvent = {
            id: uid(),
            feederId,
            filledAt: nowISO(),
            by: by?.trim() || undefined,
            notes: notes?.trim() || undefined,
          };
          const who = by?.trim();
          return {
            ...p,
            cornFillEvents: [event, ...cornEvents(p)],
            hunterRoster: who ? rememberHunter(p.hunterRoster, who) : p.hunterRoster,
          };
        }),
      setFeederDuration: (feederId, days) =>
        applyLocal((p) => ({
          ...p,
          markers: p.markers.map((m) =>
            m.id === feederId
              ? {
                  ...m,
                  fullToEmptyDays: Math.max(1, days),
                  updatedAt: nowISO(),
                }
              : m,
          ),
        })),
      setCornDefaults: (fullToEmptyDays, marginDays) =>
        applyLocal((p) => ({
          ...p,
          cornWarnDays: Math.max(1, fullToEmptyDays),
          cornWarnMarginDays: Math.max(0, marginDays),
        })),
      setPin: (pin) => applyLocal((p) => ({ ...p, pin })),
      replaceAll: (next) => {
        dirtyRef.current = true;
        applyMerged({ ...next, updatedAt: nowISO() });
      },
      resetAll: () => {
        dirtyRef.current = true;
        applyMerged(defaultData());
      },
      refreshSync: () => {
        void pullMergePush();
      },
    };
  }, [
    applyLocal,
    applyMerged,
    data,
    occupantOf,
    pullMergePush,
    ready,
    syncDetail,
    syncStatus,
  ]);

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
