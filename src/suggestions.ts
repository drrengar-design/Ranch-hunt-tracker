import type { HuntMarker } from './types';

/** Well / camp — west of Laguna. Keep blinds and shots clear of this area. */
export const WELL = {
  id: 'well',
  name: 'Well / camp',
  x: 402,
  y: 428,
  notes: 'Well and campsite on the west side of Laguna. Keep blinds, feeders, and shooting lanes clear of camp.',
};

/** ~2-acre pond, upper-left of the ranch. */
export const LAGUNA = {
  id: 'laguna',
  name: 'Laguna',
  x: 638,
  y: 452,
  notes: 'Laguna — about 2 acres. Prime watering hole; blinds should overlook water from the south or east, not from camp.',
};

/**
 * Suggested blinds sit on yellow hunting lanes, overlook Laguna where useful,
 * and stay off the well/camp buffer to the west of the pond.
 */
export const SUGGESTED_MARKERS: HuntMarker[] = [
  {
    id: 'blind-laguna-south',
    kind: 'blind',
    name: 'Laguna South',
    x: 652,
    y: 618,
    notes: 'On the lane south of Laguna. Overlooks the pond from the south, well clear of camp.',
    suggested: true,
  },
  {
    id: 'blind-laguna-east',
    kind: 'blind',
    name: 'Laguna East',
    x: 848,
    y: 448,
    notes: 'East–west lane east of Laguna. Looks west across water. Do not hunt toward the well.',
    suggested: true,
  },
  {
    id: 'blind-north-lane',
    kind: 'blind',
    name: 'North Lane',
    x: 1108,
    y: 398,
    notes: 'North boundary travel lane, well east of camp.',
    suggested: true,
  },
  {
    id: 'blind-upper-fork',
    kind: 'blind',
    name: 'Upper Fork',
    x: 978,
    y: 786,
    notes: 'Interior lane fork covering two shooting lanes in the north-central ranch.',
    suggested: true,
  },
  {
    id: 'blind-east-junction',
    kind: 'blind',
    name: 'East Junction',
    x: 1184,
    y: 986,
    notes: 'Eastern interior junction / funnel along the yellow lanes.',
    suggested: true,
  },
  {
    id: 'blind-center-lane',
    kind: 'blind',
    name: 'Center Lane',
    x: 896,
    y: 1188,
    notes: 'Main east–west interior road. High deer travel.',
    suggested: true,
  },
  {
    id: 'blind-west-interior',
    kind: 'blind',
    name: 'West Interior',
    x: 558,
    y: 1210,
    notes: 'West interior lane, south of the camp buffer.',
    suggested: true,
  },
  {
    id: 'blind-south-spine',
    kind: 'blind',
    name: 'South Spine',
    x: 1002,
    y: 1754,
    notes: 'South-central north–south lane.',
    suggested: true,
  },
  {
    id: 'blind-sw-corner',
    kind: 'blind',
    name: 'SW Corner',
    x: 524,
    y: 1688,
    notes: 'Southwest corner funnel along the boundary lane.',
    suggested: true,
  },
  {
    id: 'blind-se-approach',
    kind: 'blind',
    name: 'SE Approach',
    x: 1284,
    y: 2010,
    notes: 'Southeast lane near the south boundary.',
    suggested: true,
  },
  {
    id: 'feeder-laguna',
    kind: 'feeder',
    name: 'Laguna Feeder',
    x: 786,
    y: 562,
    notes: 'Offset between east and south Laguna blinds. Not on camp.',
    suggested: true,
  },
  {
    id: 'feeder-north',
    kind: 'feeder',
    name: 'North Feeder',
    x: 1286,
    y: 424,
    notes: 'North lane cover edge, east of camp.',
    suggested: true,
  },
  {
    id: 'feeder-upper-fork',
    kind: 'feeder',
    name: 'Upper Fork Feeder',
    x: 1088,
    y: 868,
    notes: 'Offset from Upper Fork blind along the lane.',
    suggested: true,
  },
  {
    id: 'feeder-east',
    kind: 'feeder',
    name: 'East Feeder',
    x: 1322,
    y: 1110,
    notes: 'East-side cover, off the junction.',
    suggested: true,
  },
  {
    id: 'feeder-center',
    kind: 'feeder',
    name: 'Center Feeder',
    x: 762,
    y: 1288,
    notes: 'South of the center lane.',
    suggested: true,
  },
  {
    id: 'feeder-south',
    kind: 'feeder',
    name: 'South Feeder',
    x: 882,
    y: 1884,
    notes: 'South spine cover.',
    suggested: true,
  },
  {
    id: 'feeder-sw',
    kind: 'feeder',
    name: 'SW Feeder',
    x: 642,
    y: 1804,
    notes: 'Southwest corner, lane edge.',
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
