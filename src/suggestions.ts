import type { HuntMarker } from './types';

/** Well / camp at the western access, where the 7-acre easement enters the ranch. */
export const WELL = {
  id: 'well',
  name: 'Well / camp',
  x: 442,
  y: 555,
  notes:
    'Well and campsite at the western access — the easement from the county road into the ranch. Keep blinds, feeders, and shooting lanes clear of camp.',
};

/** ~2-acre pond / tank, northeast inside the orange outline. */
export const LAGUNA = {
  id: 'laguna',
  name: 'Laguna',
  x: 1308,
  y: 180,
  /** Highlight radius in map pixels (CRS.Simple). */
  radius: 52,
  notes:
    'Laguna — about 2 acres, the dark circular tank in the northeast. Prime watering hole; hunt from the west or south, not toward camp.',
};

/**
 * Suggested blinds sit on yellow hunting lanes, overlook Laguna where useful,
 * and stay off the well/camp at the western access.
 */
export const SUGGESTED_MARKERS: HuntMarker[] = [
  {
    id: 'blind-laguna-south',
    kind: 'blind',
    name: 'Laguna West',
    x: 1227,
    y: 222,
    notes: 'Lane west of Laguna. Overlooks the pond from the west, well clear of camp.',
    suggested: true,
  },
  {
    id: 'blind-laguna-east',
    kind: 'blind',
    name: 'Laguna South',
    x: 1290,
    y: 307,
    notes: 'Lane south of Laguna. Looks north across water. Do not hunt toward camp.',
    suggested: true,
  },
  {
    id: 'blind-north-lane',
    kind: 'blind',
    name: 'East Lane',
    x: 1310,
    y: 420,
    notes: 'East-side travel lane, south of the pond and east of camp.',
    suggested: true,
  },
  {
    id: 'blind-upper-fork',
    kind: 'blind',
    name: 'Upper Fork',
    x: 1169,
    y: 372,
    notes: 'Interior lane fork on the main east–west road, east of the center cross.',
    suggested: true,
  },
  {
    id: 'blind-east-junction',
    kind: 'blind',
    name: 'East Junction',
    x: 1097,
    y: 469,
    notes: 'Eastern interior junction / funnel along the yellow lanes.',
    suggested: true,
  },
  {
    id: 'blind-center-lane',
    kind: 'blind',
    name: 'Center Lane',
    x: 1018,
    y: 344,
    notes: 'Main north–south × east–west interior cross. High deer travel.',
    suggested: true,
  },
  {
    id: 'blind-west-interior',
    kind: 'blind',
    name: 'North Interior',
    x: 1006,
    y: 190,
    notes: 'North interior lane along the property step, south of the north fence.',
    suggested: true,
  },
  {
    id: 'blind-south-spine',
    kind: 'blind',
    name: 'West Lane',
    x: 802,
    y: 405,
    notes: 'West-central east–west lane, east of camp and the access easement.',
    suggested: true,
  },
  {
    id: 'blind-sw-corner',
    kind: 'blind',
    name: 'NW Corner',
    x: 820,
    y: 181,
    notes: 'Northwest funnel along interior lanes, north of the main east–west road.',
    suggested: true,
  },
  {
    id: 'blind-se-approach',
    kind: 'blind',
    name: 'SW Approach',
    x: 720,
    y: 628,
    notes: 'Southwest lane near the south boundary, east of the camp/access.',
    suggested: true,
  },
  {
    id: 'feeder-laguna',
    kind: 'feeder',
    name: 'Laguna Feeder',
    x: 1249,
    y: 281,
    notes: 'Offset between west and south Laguna blinds. Not on camp.',
    suggested: true,
  },
  {
    id: 'feeder-north',
    kind: 'feeder',
    name: 'East Feeder',
    x: 1302,
    y: 499,
    notes: 'East-side cover south of Laguna.',
    suggested: true,
  },
  {
    id: 'feeder-upper-fork',
    kind: 'feeder',
    name: 'Upper Fork Feeder',
    x: 1140,
    y: 423,
    notes: 'Offset from Upper Fork blind along the lane.',
    suggested: true,
  },
  {
    id: 'feeder-east',
    kind: 'feeder',
    name: 'SE Feeder',
    x: 1052,
    y: 534,
    notes: 'Southeast cover, off the junction.',
    suggested: true,
  },
  {
    id: 'feeder-center',
    kind: 'feeder',
    name: 'Center Feeder',
    x: 979,
    y: 284,
    notes: 'North of the center cross, off the north–south lane.',
    suggested: true,
  },
  {
    id: 'feeder-south',
    kind: 'feeder',
    name: 'West Feeder',
    x: 748,
    y: 352,
    notes: 'West-central cover on the east–west lane, east of camp.',
    suggested: true,
  },
  {
    id: 'feeder-sw',
    kind: 'feeder',
    name: 'NW Feeder',
    x: 776,
    y: 239,
    notes: 'Northwest cover, lane edge, away from camp.',
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
