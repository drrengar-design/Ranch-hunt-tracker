import { useEffect, useState } from 'react';
import {
  feederDurationDays,
  fillsFor,
  formatCornStatus,
  isLowCorn,
  lastFillFor,
} from '../corn';
import { formatWhen, useStore } from '../store';
import type { HuntMarker } from '../types';
import { Modal } from './Modal';

export function CornStatusLine({ marker }: { marker: HuntMarker }) {
  const { data } = useStore();
  if (marker.kind !== 'feeder') return null;
  const low = isLowCorn(marker, data);
  return (
    <p className={low ? 'corn-warn' : 'meta'} style={{ margin: '4px 0 0' }}>
      {formatCornStatus(marker, data)}
    </p>
  );
}

export function CornFillHistory({
  marker,
  limit = 4,
}: {
  marker: HuntMarker;
  limit?: number;
}) {
  const { data } = useStore();
  const events = fillsFor(data, marker.id, limit);
  if (events.length === 0) return null;
  return (
    <ul className="corn-history">
      {events.map((e) => (
        <li key={e.id}>
          {formatWhen(e.filledAt)}
          {e.by ? ` · ${e.by}` : ''}
          {e.notes ? ` — ${e.notes}` : ''}
        </li>
      ))}
    </ul>
  );
}

export function FeederDurationField({ marker }: { marker: HuntMarker }) {
  const { data, setFeederDuration } = useStore();
  const current = feederDurationDays(marker, data);
  const [value, setValue] = useState(String(current));

  useEffect(() => {
    setValue(String(current));
  }, [current, marker.id]);

  const commit = () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
      setValue(String(current));
      return;
    }
    if (n !== current) setFeederDuration(marker.id, n);
  };

  return (
    <div className="field" style={{ marginBottom: 8 }}>
      <label htmlFor={`days-${marker.id}`}>Full to empty (days)</label>
      <input
        id={`days-${marker.id}`}
        type="number"
        min={1}
        max={90}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
    </div>
  );
}

export function MarkFilledButton({
  marker,
  small = true,
}: {
  marker: HuntMarker;
  small?: boolean;
}) {
  const { markCornFilled, data } = useStore();
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(data.hunterRoster[0] ?? '');
  const last = lastFillFor(data, marker.id);

  return (
    <>
      <button
        className={`btn ${small ? 'small' : ''} primary`}
        type="button"
        onClick={() => setOpen(true)}
      >
        {last ? 'Filled with corn' : 'Mark filled'}
      </button>
      {open && (
        <Modal title={`Corn · ${marker.name}`} onClose={() => setOpen(false)}>
          <p className="meta">
            Records a fill now. Low-corn warning uses this feeder’s full-to-empty
            days.
          </p>
          <div className="field">
            <label htmlFor={`fill-who-${marker.id}`}>Who (optional)</label>
            <input
              id={`fill-who-${marker.id}`}
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Name"
              autoFocus
            />
          </div>
          {data.hunterRoster.length > 0 && (
            <div className="chips" style={{ marginBottom: 12 }}>
              {data.hunterRoster.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`chip${h === who ? ' active' : ''}`}
                  onClick={() => setWho(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
          <div className="row">
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                markCornFilled(marker.id, who);
                setOpen(false);
              }}
            >
              Mark filled
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
