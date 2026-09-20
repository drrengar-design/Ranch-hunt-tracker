export type MarkerKind = 'blind' | 'feeder';

export interface HuntMarker {
  id: string;
  kind: MarkerKind;
  name: string;
  x: number;
  y: number;
  notes: string;
  suggested?: boolean;
  /** Last local/remote edit; used for per-marker last-write-wins merge. */
  updatedAt?: string;
  /** Days from a full fill until this feeder is empty. Feeders only. */
  fullToEmptyDays?: number;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  updatedAt?: string;
}

export interface CheckIn {
  id: string;
  markerId: string;
  seasonId: string;
  hunterName: string;
  at: string;
  outAt?: string;
  updatedAt?: string;
}

export type GameSex = 'buck' | 'doe' | 'boar' | 'sow' | 'unknown';

export interface HarvestEntry {
  id: string;
  seasonId: string;
  hunterName: string;
  species: string;
  sex: GameSex;
  date: string;
  markerId?: string;
  notes: string;
  updatedAt?: string;
}

/** One append-only corn-fill event for a feeder. */
export interface CornFillEvent {
  id: string;
  feederId: string;
  filledAt: string;
  by?: string;
  notes?: string;
}

export interface AppData {
  version: 1;
  /** Ranch photo + default pin layout. Bumped when the map asset changes. */
  layoutVersion: number;
  pin: string;
  markers: HuntMarker[];
  seasons: Season[];
  activeSeasonId: string;
  checkIns: CheckIn[];
  harvests: HarvestEntry[];
  hunterRoster: string[];
  /** Document timestamp for last-write-wins of scalar settings. */
  updatedAt?: string;
  /** Append-only fill log; last fill per feeder is derived from this. */
  cornFillEvents?: CornFillEvent[];
  /**
   * Default full→empty days for feeders that have no per-feeder override.
   * Also used when creating new feeders.
   */
  cornWarnDays?: number;
  /** Warn this many days before projected empty. Default 1. */
  cornWarnMarginDays?: number;
  /** Marker ids deleted on any device; union-merged so deletes stay gone. */
  removedMarkerIds?: string[];
}

export type TabId =
  | 'map'
  | 'blinds'
  | 'seasons'
  | 'harvest'
  | 'history'
  | 'settings';

export type SyncStatus = 'local' | 'syncing' | 'live' | 'offline' | 'error';
