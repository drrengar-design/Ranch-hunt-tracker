/**
 * Read-only TPWD Outdoor Annual dates for Duval County (Ramirez / South Zone).
 * Not ranch-managed seasons. Confirm on the official county page before hunting.
 *
 * Sources (fetched Sep 2026):
 * - https://tpwd.texas.gov/regulations/outdoor-annual/regs/counties/duval
 * - https://tpwd.texas.gov/regulations/outdoor-annual/hunting/2025_2026_hunting_seasons
 * - https://tpwd.texas.gov/regulations/outdoor-annual/hunting/2026-2027-hunting-season-dates
 */

export const TPWD_DUVAL_URL =
  'https://tpwd.texas.gov/regulations/outdoor-annual/regs/counties/duval';
export const TPWD_OUTDOOR_ANNUAL_URL =
  'https://tpwd.texas.gov/regulations/outdoor-annual/';
export const TPWD_2025_26_DATES_URL =
  'https://tpwd.texas.gov/regulations/outdoor-annual/hunting/2025_2026_hunting_seasons';
export const TPWD_2026_27_DATES_URL =
  'https://tpwd.texas.gov/regulations/outdoor-annual/hunting/2026-2027-hunting-season-dates';

export type LicenseYearId = '2025-26' | '2026-27';

export interface DateRange {
  start: string;
  end: string;
}

export interface SeasonPeriod {
  id: string;
  label: string;
  ranges: DateRange[];
  note?: string;
}

export interface SpeciesRegs {
  id: string;
  name: string;
  zone?: string;
  bag?: string;
  notes?: string[];
  periods: SeasonPeriod[];
}

export interface LicenseYearRegs {
  id: LicenseYearId;
  label: string;
  shortLabel: string;
  /** Inclusive license-year window used to pick the default tab year. */
  yearStart: string;
  yearEnd: string;
  sourceNote: string;
  sourceUrls: { label: string; href: string }[];
  species: SpeciesRegs[];
}

const MONTHS = [
  'Jan.',
  'Feb.',
  'Mar.',
  'Apr.',
  'May',
  'June',
  'July',
  'Aug.',
  'Sept.',
  'Oct.',
  'Nov.',
  'Dec.',
] as const;

export function localISODate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

export function isDateInRange(iso: string, range: DateRange): boolean {
  return iso >= range.start && iso <= range.end;
}

export function isPeriodOpen(period: SeasonPeriod, iso: string): boolean {
  return period.ranges.some((range) => isDateInRange(iso, range));
}

export function isSpeciesOpen(species: SpeciesRegs, iso: string): boolean {
  return species.periods.some((period) => isPeriodOpen(period, iso));
}

export function formatRange(range: DateRange): string {
  const s = parseISODate(range.start);
  const e = parseISODate(range.end);
  const sm = MONTHS[s.month - 1];
  const em = MONTHS[e.month - 1];
  if (s.year === e.year && s.month === e.month) {
    return `${sm} ${s.day}–${e.day}, ${s.year}`;
  }
  if (s.year === e.year) {
    return `${sm} ${s.day} – ${em} ${e.day}, ${s.year}`;
  }
  return `${sm} ${s.day}, ${s.year} – ${em} ${e.day}, ${e.year}`;
}

export function formatRanges(ranges: DateRange[]): string {
  return ranges.map(formatRange).join('; ');
}

export function defaultLicenseYear(
  iso: string,
  years: LicenseYearRegs[] = LICENSE_YEARS,
): LicenseYearId {
  const match = years.find((y) => iso >= y.yearStart && iso <= y.yearEnd);
  if (match) return match.id;
  return [...years].sort((a, b) => b.yearEnd.localeCompare(a.yearEnd))[0].id;
}

export function openSpecies(year: LicenseYearRegs, iso: string): SpeciesRegs[] {
  return year.species.filter((species) => isSpeciesOpen(species, iso));
}

const YEAR_2025_26: LicenseYearRegs = {
  id: '2025-26',
  label: '2025–2026',
  shortLabel: '25–26',
  yearStart: '2025-09-01',
  yearEnd: '2026-08-31',
  sourceNote:
    'Prior license year. White-tailed deer and other Duval / South Zone dates from the TPWD Duval county listing and the 2025–2026 Outdoor Annual dates page.',
  sourceUrls: [
    { label: 'TPWD Duval County', href: TPWD_DUVAL_URL },
    { label: '2025–2026 season dates', href: TPWD_2025_26_DATES_URL },
  ],
  species: [
    {
      id: 'deer',
      name: 'White-tailed deer',
      zone: 'South Zone / Duval',
      bag: '5 deer, no more than 3 bucks',
      notes: [
        'If MLDP buck or antlerless tags have been issued for a property, harvest is by MLDP tag only. Hunters using MLDP tags need a Resident or Non-resident General hunting license.',
        'Special late: antlerless deer and unbranched-antler bucks only (a buck with no more than one point on an antler).',
        'Youth-only: licensed hunters 16 or younger.',
      ],
      periods: [
        {
          id: 'archery',
          label: 'Archery only',
          ranges: [{ start: '2025-09-27', end: '2025-10-31' }],
        },
        {
          id: 'youth-early',
          label: 'Early youth-only',
          ranges: [{ start: '2025-10-24', end: '2025-10-26' }],
        },
        {
          id: 'general',
          label: 'General',
          ranges: [{ start: '2025-11-01', end: '2026-01-18' }],
        },
        {
          id: 'youth-late',
          label: 'Late youth-only',
          ranges: [{ start: '2026-01-05', end: '2026-01-18' }],
        },
        {
          id: 'special-late',
          label: 'Special late',
          ranges: [{ start: '2026-01-19', end: '2026-02-01' }],
          note: 'Antlerless and unbranched-antler bucks only',
        },
      ],
    },
    {
      id: 'turkey',
      name: 'Wild turkey',
      zone: 'South Zone',
      bag: '4 turkeys, gobblers or bearded hens (statewide annual aggregate 4; only 1 may be from the East Zone)',
      notes: ['Mandatory harvest reporting via Texas Hunt & Fish app or TPWD online.'],
      periods: [
        {
          id: 'archery',
          label: 'Archery only',
          ranges: [{ start: '2025-09-27', end: '2025-10-31' }],
        },
        {
          id: 'youth-fall',
          label: 'Fall youth-only',
          ranges: [
            { start: '2025-10-24', end: '2025-10-26' },
            { start: '2026-01-19', end: '2026-02-01' },
          ],
        },
        {
          id: 'fall',
          label: 'Fall',
          ranges: [{ start: '2025-11-01', end: '2026-01-18' }],
        },
        {
          id: 'youth-spring',
          label: 'Spring youth-only',
          ranges: [
            { start: '2026-03-07', end: '2026-03-08' },
            { start: '2026-05-02', end: '2026-05-03' },
          ],
        },
        {
          id: 'spring',
          label: 'Spring',
          ranges: [{ start: '2026-03-14', end: '2026-04-26' }],
        },
      ],
    },
    {
      id: 'javelina',
      name: 'Javelina',
      zone: 'Southern',
      bag: '2 per license year',
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2025-09-01', end: '2026-08-31' }],
        },
      ],
    },
    {
      id: 'dove',
      name: 'Dove',
      zone: 'South Zone',
      bag: '15 white-winged, mourning, and white-tipped in the aggregate, no more than 2 white-tipped',
      notes: ['Migratory game bird endorsement and HIP certification required.'],
      periods: [
        {
          id: 'ww-days',
          label: 'Special white-winged dove days',
          ranges: [
            { start: '2025-09-05', end: '2025-09-07' },
            { start: '2025-09-12', end: '2025-09-13' },
          ],
        },
        {
          id: 'regular',
          label: 'Regular',
          ranges: [
            { start: '2025-09-14', end: '2025-10-26' },
            { start: '2025-12-12', end: '2026-01-22' },
          ],
        },
      ],
    },
    {
      id: 'quail',
      name: 'Quail',
      zone: 'Statewide',
      bag: 'Daily 15 · possession 45',
      notes: ['Upland game bird endorsement required. No open season for Mearns’ (Montezuma) quail.'],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2025-11-01', end: '2026-02-28' }],
        },
      ],
    },
    {
      id: 'squirrel',
      name: 'Squirrel',
      zone: 'All other counties (Duval)',
      periods: [
        {
          id: 'general',
          label: 'General',
          ranges: [{ start: '2025-09-01', end: '2026-08-31' }],
        },
      ],
    },
    {
      id: 'teal',
      name: 'Teal',
      zone: 'Statewide',
      bag: 'Daily 6 in the aggregate',
      notes: [
        'Migratory game bird endorsement, HIP certification, and Federal Duck Stamp required.',
      ],
      periods: [
        {
          id: 'september',
          label: 'September teal only',
          ranges: [{ start: '2025-09-20', end: '2025-09-28' }],
        },
      ],
    },
    {
      id: 'duck',
      name: 'Duck',
      zone: 'South Zone',
      bag: 'Daily 6 in the aggregate (includes mergansers); see TPWD for species caps. Coot daily 15.',
      notes: [
        'Migratory game bird endorsement, HIP certification, and Federal Duck Stamp required.',
      ],
      periods: [
        {
          id: 'youth-vet',
          label: 'Youth / veterans & active duty',
          ranges: [{ start: '2025-10-25', end: '2025-10-26' }],
        },
        {
          id: 'regular',
          label: 'Regular',
          ranges: [
            { start: '2025-11-01', end: '2025-11-30' },
            { start: '2025-12-13', end: '2026-01-25' },
          ],
        },
      ],
    },
  ],
};

const YEAR_2026_27: LicenseYearRegs = {
  id: '2026-27',
  label: '2026–2027',
  shortLabel: '26–27',
  yearStart: '2026-09-01',
  yearEnd: '2027-08-31',
  sourceNote:
    'Current Outdoor Annual on the TPWD Duval county page (South Zone / county seat San Diego).',
  sourceUrls: [
    { label: 'TPWD Duval County', href: TPWD_DUVAL_URL },
    { label: '2026–2027 season dates', href: TPWD_2026_27_DATES_URL },
  ],
  species: [
    {
      id: 'deer',
      name: 'White-tailed deer',
      zone: 'South Zone / Duval',
      bag: '5 deer, no more than 3 bucks',
      notes: [
        'If MLDP buck or antlerless tags have been issued for a property, harvest is by MLDP tag only. Hunters using MLDP tags need a Resident or Non-resident General hunting license.',
        'Special late: antlerless deer and unbranched-antler bucks only (a buck with no more than one point on an antler).',
        'Youth-only: licensed hunters 16 or younger. The Duval county page lists early youth-only only for 2026–2027 deer.',
      ],
      periods: [
        {
          id: 'archery',
          label: 'Archery only',
          ranges: [{ start: '2026-10-03', end: '2026-11-06' }],
        },
        {
          id: 'youth-early',
          label: 'Early youth-only',
          ranges: [{ start: '2026-10-30', end: '2026-11-01' }],
        },
        {
          id: 'general',
          label: 'General',
          ranges: [{ start: '2026-11-07', end: '2027-01-17' }],
        },
        {
          id: 'special-late',
          label: 'Special late',
          ranges: [{ start: '2027-01-18', end: '2027-01-31' }],
          note: 'Antlerless and unbranched-antler bucks only',
        },
      ],
    },
    {
      id: 'turkey',
      name: 'Wild turkey',
      zone: 'South Zone',
      bag: '4 turkeys, gobblers or bearded hens (statewide annual aggregate 4; only 1 may be from the East Zone)',
      notes: ['Mandatory harvest reporting via Texas Hunt & Fish app or TPWD online.'],
      periods: [
        {
          id: 'archery',
          label: 'Archery only',
          ranges: [{ start: '2026-10-03', end: '2026-11-06' }],
        },
        {
          id: 'youth-fall',
          label: 'Fall youth-only',
          ranges: [
            { start: '2026-10-30', end: '2026-11-01' },
            { start: '2027-01-18', end: '2027-01-31' },
          ],
        },
        {
          id: 'fall',
          label: 'Fall',
          ranges: [{ start: '2026-11-07', end: '2027-01-17' }],
        },
        {
          id: 'youth-spring',
          label: 'Spring youth-only',
          ranges: [
            { start: '2027-03-13', end: '2027-03-14' },
            { start: '2027-05-08', end: '2027-05-09' },
          ],
        },
        {
          id: 'spring',
          label: 'Spring',
          ranges: [{ start: '2027-03-20', end: '2027-05-02' }],
        },
      ],
    },
    {
      id: 'javelina',
      name: 'Javelina',
      zone: 'Southern',
      bag: '2 per license year · possession 2',
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2026-09-01', end: '2027-08-31' }],
        },
      ],
    },
    {
      id: 'dove',
      name: 'Dove',
      zone: 'South Zone',
      bag: '15 white-winged, mourning, and white-tipped in the aggregate, no more than 2 white-tipped',
      notes: [
        'Migratory game bird endorsement and HIP certification required. Legal shooting hours: one-half hour before sunrise to sunset.',
      ],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [
            { start: '2026-09-01', end: '2026-10-25' },
            { start: '2026-12-18', end: '2027-01-21' },
          ],
        },
      ],
    },
    {
      id: 'quail',
      name: 'Quail',
      zone: 'Statewide',
      bag: 'Daily 15 · possession 45',
      notes: ['Upland game bird endorsement required. No open season for Mearns’ (Montezuma) quail.'],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2026-11-01', end: '2027-02-28' }],
        },
      ],
    },
    {
      id: 'squirrel',
      name: 'Squirrel',
      zone: 'All other counties (Duval)',
      periods: [
        {
          id: 'general',
          label: 'General',
          ranges: [{ start: '2026-09-01', end: '2027-08-31' }],
        },
      ],
    },
    {
      id: 'teal',
      name: 'Teal',
      zone: 'Statewide',
      bag: 'Daily 6 in the aggregate',
      notes: [
        'Migratory game bird endorsement, HIP certification, and Federal Duck Stamp required.',
      ],
      periods: [
        {
          id: 'september',
          label: 'September teal only',
          ranges: [{ start: '2026-09-19', end: '2026-09-27' }],
        },
      ],
    },
    {
      id: 'duck',
      name: 'Duck',
      zone: 'South Zone',
      bag: 'Daily 6 in the aggregate (includes mergansers); species caps on TPWD. Coot daily 15.',
      notes: [
        'Migratory game bird endorsement, HIP certification, and Federal Duck Stamp required.',
        '“Dusky” ducks (mottled, Mexican, black, and hybrids) closed the first five days of each zone’s season — South Zone dusky dates Nov. 12–29, 2026 and Dec. 12, 2026 – Jan. 31, 2027.',
      ],
      periods: [
        {
          id: 'youth-vet',
          label: 'Youth / veterans & active duty',
          ranges: [{ start: '2026-10-31', end: '2026-11-01' }],
        },
        {
          id: 'regular',
          label: 'Regular',
          ranges: [
            { start: '2026-11-07', end: '2026-11-29' },
            { start: '2026-12-12', end: '2027-01-31' },
          ],
        },
      ],
    },
    {
      id: 'goose',
      name: 'Goose',
      zone: 'Eastern Zone',
      bag: '5 early Canada; 5 regular dark (no more than 2 white-fronted); 5 light in the aggregate',
      notes: [
        'Migratory game bird endorsement, HIP certification, and Federal Duck Stamp required.',
      ],
      periods: [
        {
          id: 'early-canada',
          label: 'Early Canada geese',
          ranges: [{ start: '2026-09-12', end: '2026-09-27' }],
        },
        {
          id: 'dark',
          label: 'Dark geese',
          ranges: [{ start: '2026-11-07', end: '2027-01-31' }],
        },
        {
          id: 'light',
          label: 'Light geese',
          ranges: [{ start: '2026-11-07', end: '2027-02-19' }],
        },
      ],
    },
    {
      id: 'crane',
      name: 'Sandhill crane',
      zone: 'Zone C',
      bag: 'Daily 2 · possession 6',
      notes: [
        'Migratory game bird endorsement, Federal Sandhill Crane Permit, and HIP certification required.',
      ],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2026-12-12', end: '2027-01-17' }],
        },
      ],
    },
    {
      id: 'rails',
      name: 'Rails, gallinules & moorhens',
      zone: 'Statewide',
      bag: '15 king/clapper; 25 sora/Virginia; 15 moorhens and purple gallinules (each group in the aggregate)',
      notes: ['Migratory game bird endorsement and HIP certification required.'],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [
            { start: '2026-09-19', end: '2026-09-27' },
            { start: '2026-11-07', end: '2027-01-06' },
          ],
        },
      ],
    },
    {
      id: 'snipe',
      name: 'Wilson’s snipe',
      zone: 'Statewide',
      bag: 'Daily 8',
      notes: ['Migratory game bird endorsement and HIP certification required.'],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2026-11-07', end: '2027-02-21' }],
        },
      ],
    },
    {
      id: 'woodcock',
      name: 'Woodcock',
      zone: 'Statewide',
      bag: 'Daily 3',
      notes: ['Migratory game bird endorsement and HIP certification required.'],
      periods: [
        {
          id: 'regular',
          label: 'Regular',
          ranges: [{ start: '2026-12-18', end: '2027-01-31' }],
        },
      ],
    },
    {
      id: 'alligator',
      name: 'Alligator',
      zone: 'Non-core (Duval)',
      bag: '1 per person per year',
      periods: [
        {
          id: 'general',
          label: 'General',
          ranges: [{ start: '2027-04-01', end: '2027-06-30' }],
        },
      ],
    },
  ],
};

export const LICENSE_YEARS: LicenseYearRegs[] = [YEAR_2026_27, YEAR_2025_26];

export function yearById(id: LicenseYearId): LicenseYearRegs {
  const found = LICENSE_YEARS.find((y) => y.id === id);
  if (!found) throw new Error(`Unknown license year ${id}`);
  return found;
}
