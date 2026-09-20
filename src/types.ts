export type MarkerKind = 'blind' | 'feeder';

export interface HuntMarker {
  id: string;
  kind: MarkerKind;
  name: string;
  x: number;
  y: number;
  notes: string;
  suggested?: boolean;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CheckIn {
  id: string;
  markerId: string;
  seasonId: string;
  hunterName: string;
  at: string;
  outAt?: string;
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
}

export interface AppData {
  version: 1;
  /** Increments when the ranch map image / suggested pin layout changes. */
  mapRevision: number;
  pin: string;
  markers: HuntMarker[];
  seasons: Season[];
  activeSeasonId: string;
  checkIns: CheckIn[];
  harvests: HarvestEntry[];
  hunterRoster: string[];
}

export type TabId = 'map' | 'blinds' | 'seasons' | 'harvest' | 'settings';
