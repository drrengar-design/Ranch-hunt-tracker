import { describe, expect, it } from 'vitest';
import {
  defaultLicenseYear,
  formatRange,
  formatRanges,
  isPeriodOpen,
  isSpeciesOpen,
  localISODate,
  openSpecies,
  yearById,
} from './tpwdRegs';

describe('formatRange', () => {
  it('formats a same-month span the TPWD way', () => {
    expect(formatRange({ start: '2025-10-24', end: '2025-10-26' })).toBe(
      'Oct. 24–26, 2025',
    );
  });

  it('formats a same-year span', () => {
    expect(formatRange({ start: '2025-09-27', end: '2025-10-31' })).toBe(
      'Sept. 27 – Oct. 31, 2025',
    );
  });

  it('formats a cross-year span', () => {
    expect(formatRange({ start: '2025-11-01', end: '2026-01-18' })).toBe(
      'Nov. 1, 2025 – Jan. 18, 2026',
    );
  });

  it('joins split dove periods', () => {
    expect(
      formatRanges([
        { start: '2026-09-01', end: '2026-10-25' },
        { start: '2026-12-18', end: '2027-01-21' },
      ]),
    ).toBe('Sept. 1 – Oct. 25, 2026; Dec. 18, 2026 – Jan. 21, 2027');
  });
});

describe('open-now helpers', () => {
  const deer = yearById('2025-26').species.find((s) => s.id === 'deer')!;
  const archery = deer.periods.find((p) => p.id === 'archery')!;

  it('treats range ends as inclusive', () => {
    expect(isPeriodOpen(archery, '2025-09-27')).toBe(true);
    expect(isPeriodOpen(archery, '2025-10-31')).toBe(true);
    expect(isPeriodOpen(archery, '2025-09-26')).toBe(false);
    expect(isPeriodOpen(archery, '2025-11-01')).toBe(false);
  });

  it('marks 2025–26 general deer open in December 2025', () => {
    expect(isSpeciesOpen(deer, '2025-12-15')).toBe(true);
    expect(isSpeciesOpen(deer, '2026-01-18')).toBe(true);
    expect(isSpeciesOpen(deer, '2026-01-19')).toBe(true); // special late
    expect(isSpeciesOpen(deer, '2026-02-02')).toBe(false);
  });

  it('highlights South Zone species open on Sep 21, 2026', () => {
    const year = yearById('2026-27');
    const open = openSpecies(year, '2026-09-21').map((s) => s.id);
    expect(open).toEqual(
      expect.arrayContaining(['dove', 'javelina', 'squirrel', 'teal', 'goose', 'rails']),
    );
    expect(open).not.toContain('deer');
    expect(open).not.toContain('quail');
    expect(open).not.toContain('turkey');
  });
});

describe('defaultLicenseYear', () => {
  it('picks 2025–26 during that license year', () => {
    expect(defaultLicenseYear('2025-11-01')).toBe('2025-26');
    expect(defaultLicenseYear('2026-08-31')).toBe('2025-26');
  });

  it('picks 2026–27 on and after Sep 1, 2026', () => {
    expect(defaultLicenseYear('2026-09-01')).toBe('2026-27');
    expect(defaultLicenseYear('2026-09-21')).toBe('2026-27');
  });
});

describe('localISODate', () => {
  it('uses the local calendar date, not UTC', () => {
    expect(localISODate(new Date(2026, 8, 21, 23, 30))).toBe('2026-09-21');
  });
});

describe('cited 2025–26 deer dates', () => {
  it('matches the TPWD Duval / South Zone list', () => {
    const deer = yearById('2025-26').species.find((s) => s.id === 'deer')!;
    const byId = Object.fromEntries(deer.periods.map((p) => [p.id, p.ranges]));
    expect(byId.archery).toEqual([{ start: '2025-09-27', end: '2025-10-31' }]);
    expect(byId.general).toEqual([{ start: '2025-11-01', end: '2026-01-18' }]);
    expect(byId['youth-early']).toEqual([{ start: '2025-10-24', end: '2025-10-26' }]);
    expect(byId['youth-late']).toEqual([{ start: '2026-01-05', end: '2026-01-18' }]);
    expect(byId['special-late']).toEqual([{ start: '2026-01-19', end: '2026-02-01' }]);
    expect(deer.bag).toMatch(/5 deer/i);
  });
});
