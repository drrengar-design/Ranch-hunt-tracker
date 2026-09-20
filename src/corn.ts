import type { AppData, CornFillEvent, HuntMarker } from './types';

/** Default days from a full feeder to empty if unset on the marker. */
export const DEFAULT_FULL_TO_EMPTY_DAYS = 7;
/** Warn this many days before projected empty. */
export const DEFAULT_CORN_WARN_MARGIN_DAYS = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

export function cornEvents(data: AppData): CornFillEvent[] {
  return Array.isArray(data.cornFillEvents) ? data.cornFillEvents : [];
}

export function lastFillFor(
  data: AppData,
  feederId: string,
): CornFillEvent | undefined {
  return cornEvents(data)
    .filter((e) => e.feederId === feederId)
    .sort((a, b) => b.filledAt.localeCompare(a.filledAt))[0];
}

export function fillsFor(
  data: AppData,
  feederId: string,
  limit = 8,
): CornFillEvent[] {
  return cornEvents(data)
    .filter((e) => e.feederId === feederId)
    .sort((a, b) => b.filledAt.localeCompare(a.filledAt))
    .slice(0, limit);
}

function positiveDays(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export function defaultFeederDurationDays(data: AppData): number {
  return positiveDays(data.cornWarnDays, DEFAULT_FULL_TO_EMPTY_DAYS);
}

export function feederDurationDays(marker: HuntMarker, data: AppData): number {
  return positiveDays(marker.fullToEmptyDays, defaultFeederDurationDays(data));
}

export function cornMarginDays(data: AppData): number {
  const n =
    typeof data.cornWarnMarginDays === 'number'
      ? data.cornWarnMarginDays
      : DEFAULT_CORN_WARN_MARGIN_DAYS;
  if (!Number.isFinite(n) || n < 0) return DEFAULT_CORN_WARN_MARGIN_DAYS;
  return n;
}

export function projectedEmptyMs(
  marker: HuntMarker,
  data: AppData,
): number | null {
  const last = lastFillFor(data, marker.id);
  if (!last) return null;
  const filled = Date.parse(last.filledAt);
  if (!Number.isFinite(filled)) return null;
  return filled + feederDurationDays(marker, data) * DAY_MS;
}

export function isLowCorn(
  marker: HuntMarker,
  data: AppData,
  now = Date.now(),
): boolean {
  if (marker.kind !== 'feeder') return false;
  const emptyAt = projectedEmptyMs(marker, data);
  if (emptyAt == null) return true;
  const warnAt = emptyAt - cornMarginDays(data) * DAY_MS;
  return now >= warnAt;
}

export function daysUntilEmpty(
  marker: HuntMarker,
  data: AppData,
  now = Date.now(),
): number | null {
  const emptyAt = projectedEmptyMs(marker, data);
  if (emptyAt == null) return null;
  return (emptyAt - now) / DAY_MS;
}

export function formatCornStatus(
  marker: HuntMarker,
  data: AppData,
  now = Date.now(),
): string {
  const last = lastFillFor(data, marker.id);
  if (!last) return 'Never filled · low corn';
  const remaining = daysUntilEmpty(marker, data, now);
  if (remaining == null) return `Filled ${formatWhenShort(last.filledAt)}`;
  if (remaining <= 0) {
    const overdue = Math.abs(remaining);
    return `Low corn · empty ~${overdue.toFixed(0)}d ago`;
  }
  if (isLowCorn(marker, data, now)) {
    return `Low corn · ~${remaining.toFixed(1)}d left`;
  }
  return `Filled ${formatWhenShort(last.filledAt)} · empty in ~${remaining.toFixed(0)}d`;
}

function formatWhenShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
