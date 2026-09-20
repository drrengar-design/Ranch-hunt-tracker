import type { HuntMarker } from './types';

/** Well / camp — northeast corner, north of Laguna. */
export const WELL = {
  id: 'well',
  name: 'Well / camp',
  x: 1306,
  y: 99,
  notes:
    'Well and campsite at the northeast corner of the ranch, north of Laguna. Keep blinds, feeders, and shooting lanes clear of camp.',
};

/** ~2-acre pond in the northeast ranch. */
export const LAGUNA = {
  id: 'laguna',
  name: 'Laguna',
  x: 1303,
  y: 225,
  notes:
    'Laguna — about 2 acres in the northeast ranch. Prime watering hole; blinds should overlook water and stay clear of the well/camp.',
};

/**
 * Initial blinds and feeders from the ranch photo marker layout
 * (1476×787 pixel coordinates).
 */
export const SUGGESTED_MARKERS: HuntMarker[] = [
  {
    id: 'b1',
    kind: 'blind',
    name: 'Blind 1',
    x: 858,
    y: 258,
    notes: 'North-central lane junction.',
    suggested: true,
  },
  {
    id: 'b2',
    kind: 'blind',
    name: 'Blind 2',
    x: 1093,
    y: 287,
    notes: 'Northeast interior lane, between Blind 4 and Blind 7.',
    suggested: true,
  },
  {
    id: 'b3',
    kind: 'blind',
    name: 'Blind 3',
    x: 711,
    y: 329,
    notes: 'West interior lane, west of Blind 1.',
    suggested: true,
  },
  {
    id: 'b4',
    kind: 'blind',
    name: 'Blind 4',
    x: 1288,
    y: 373,
    notes: 'East lane west of Blind 5, south of Laguna.',
    suggested: true,
  },
  {
    id: 'b5',
    kind: 'blind',
    name: 'Blind 5',
    x: 1407,
    y: 373,
    notes: 'Far-east boundary lane.',
    suggested: true,
  },
  {
    id: 'b6',
    kind: 'blind',
    name: 'Blind 6',
    x: 827,
    y: 405,
    notes: 'North–south lane south of Blind 1.',
    suggested: true,
  },
  {
    id: 'b7',
    kind: 'blind',
    name: 'Blind 7',
    x: 1137,
    y: 493,
    notes: 'Southeast fork of the northeast lane cluster.',
    suggested: true,
  },
  {
    id: 'f1',
    kind: 'feeder',
    name: 'Feeder 1',
    x: 859,
    y: 312,
    notes: 'Offset south of Blind 1.',
    suggested: true,
  },
  {
    id: 'f2',
    kind: 'feeder',
    name: 'Feeder 2',
    x: 1099,
    y: 341,
    notes: 'Offset south of Blind 2.',
    suggested: true,
  },
  {
    id: 'f3',
    kind: 'feeder',
    name: 'Feeder 3',
    x: 724,
    y: 275,
    notes: 'Offset north of Blind 3.',
    suggested: true,
  },
  {
    id: 'f4',
    kind: 'feeder',
    name: 'Feeder 4',
    x: 1342,
    y: 369,
    notes: 'Between Blind 4 and Blind 5 on the east lane.',
    suggested: true,
  },
  {
    id: 'f5',
    kind: 'feeder',
    name: 'Feeder 5',
    x: 1408,
    y: 318,
    notes: 'North of Blind 5 on the east boundary.',
    suggested: true,
  },
  {
    id: 'f6',
    kind: 'feeder',
    name: 'Feeder 6',
    x: 864,
    y: 444,
    notes: 'South of Blind 6 on the north–south lane.',
    suggested: true,
  },
  {
    id: 'f7',
    kind: 'feeder',
    name: 'Feeder 7',
    x: 1189,
    y: 475,
    notes: 'East of Blind 7.',
    suggested: true,
  },
];

export function defaultSeason() {
  return {
    id: 'season-2026',
    name: '2026–27 Season',
    startDate: '2026-09-01',
    endDate: '2027-01-31',
  };
}
