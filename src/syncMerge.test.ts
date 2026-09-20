import { describe, expect, it } from 'vitest';
import { mergeAppData, mergeById } from './syncMerge';
import { defaultData } from './storage';
import {
  DEFAULT_FULL_TO_EMPTY_DAYS,
  isLowCorn,
  lastFillFor,
  projectedEmptyMs,
} from './corn';
import type { AppData, CheckIn, HuntMarker } from './types';

function feeder(partial: Partial<HuntMarker> = {}): HuntMarker {
  return {
    id: 'f1',
    kind: 'feeder',
    name: 'Feeder 1',
    x: 10,
    y: 20,
    notes: '',
    ...partial,
  };
}

function checkIn(partial: Partial<CheckIn> & Pick<CheckIn, 'id'>): CheckIn {
  return {
    markerId: 'b1',
    seasonId: 'season-2026',
    hunterName: 'Pat',
    at: '2026-09-20T12:00:00.000Z',
    updatedAt: partial.at ?? '2026-09-20T12:00:00.000Z',
    ...partial,
  };
}

describe('mergeAppData', () => {
  it('keeps distinct check-ins from two devices', () => {
    const local: AppData = {
      ...defaultData(),
      updatedAt: '2026-09-20T12:00:00.000Z',
      checkIns: [checkIn({ id: 'a', markerId: 'b1', hunterName: 'Ann' })],
    };
    const remote: AppData = {
      ...defaultData(),
      updatedAt: '2026-09-20T12:00:01.000Z',
      checkIns: [checkIn({ id: 'b', markerId: 'b2', hunterName: 'Bob' })],
    };
    const merged = mergeAppData(local, remote);
    expect(merged.checkIns.map((c) => c.id).sort()).toEqual(['a', 'b']);
  });

  it('same check-in id: later updatedAt wins', () => {
    const local: AppData = {
      ...defaultData(),
      checkIns: [
        checkIn({
          id: 'a',
          hunterName: 'Ann',
          updatedAt: '2026-09-20T12:00:00.000Z',
        }),
      ],
    };
    const remote: AppData = {
      ...defaultData(),
      checkIns: [
        checkIn({
          id: 'a',
          hunterName: 'Ann',
          outAt: '2026-09-20T13:00:00.000Z',
          updatedAt: '2026-09-20T13:00:00.000Z',
        }),
      ],
    };
    const merged = mergeAppData(local, remote);
    expect(merged.checkIns).toHaveLength(1);
    expect(merged.checkIns[0].outAt).toBe('2026-09-20T13:00:00.000Z');
  });

  it('later marker position wins for the same id; other markers survive', () => {
    const local: AppData = {
      ...defaultData(),
      markers: [
        feeder({ id: 'f1', x: 1, y: 1, updatedAt: '2026-09-20T10:00:00.000Z' }),
        feeder({ id: 'f2', x: 5, y: 5, updatedAt: '2026-09-20T10:00:00.000Z' }),
      ],
    };
    const remote: AppData = {
      ...defaultData(),
      markers: [
        feeder({ id: 'f1', x: 99, y: 88, updatedAt: '2026-09-20T11:00:00.000Z' }),
      ],
    };
    const merged = mergeAppData(local, remote);
    const f1 = merged.markers.find((m) => m.id === 'f1');
    const f2 = merged.markers.find((m) => m.id === 'f2');
    expect(f1?.x).toBe(99);
    expect(f1?.y).toBe(88);
    expect(f2?.x).toBe(5);
  });

  it('unions corn fill events by id', () => {
    const local: AppData = {
      ...defaultData(),
      cornFillEvents: [
        { id: 'c1', feederId: 'f1', filledAt: '2026-09-01T00:00:00.000Z' },
      ],
    };
    const remote: AppData = {
      ...defaultData(),
      cornFillEvents: [
        { id: 'c2', feederId: 'f1', filledAt: '2026-09-10T00:00:00.000Z' },
      ],
    };
    const merged = mergeAppData(local, remote);
    expect(merged.cornFillEvents?.map((e) => e.id).sort()).toEqual(['c1', 'c2']);
    expect(lastFillFor(merged, 'f1')?.id).toBe('c2');
  });
});

describe('mergeById', () => {
  it('prefers the later timestamp', () => {
    const out = mergeById(
      [{ id: '1', updatedAt: '2026-01-01T00:00:00.000Z', n: 1 }],
      [{ id: '1', updatedAt: '2026-02-01T00:00:00.000Z', n: 2 }],
    );
    expect(out).toEqual([
      { id: '1', updatedAt: '2026-02-01T00:00:00.000Z', n: 2 },
    ]);
  });
});

describe('low corn', () => {
  const now = Date.parse('2026-09-20T00:00:00.000Z');

  it('warns when never filled', () => {
    const data = { ...defaultData(), markers: [feeder()], cornFillEvents: [] };
    expect(isLowCorn(feeder(), data, now)).toBe(true);
  });

  it('uses per-feeder fullToEmptyDays for projected empty', () => {
    const marker = feeder({ fullToEmptyDays: 10 });
    const data: AppData = {
      ...defaultData(),
      cornWarnDays: DEFAULT_FULL_TO_EMPTY_DAYS,
      cornWarnMarginDays: 1,
      cornFillEvents: [
        {
          id: 'c1',
          feederId: 'f1',
          filledAt: '2026-09-11T00:00:00.000Z',
        },
      ],
    };
    const emptyAt = projectedEmptyMs(marker, data);
    expect(emptyAt).toBe(Date.parse('2026-09-21T00:00:00.000Z'));
    expect(isLowCorn(marker, data, now)).toBe(true);
    expect(
      isLowCorn(marker, data, Date.parse('2026-09-18T00:00:00.000Z')),
    ).toBe(false);
  });
});
