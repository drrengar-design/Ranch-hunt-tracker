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

const DURATION_PRESETS: { days: number; label: string }[] = [
  { days: 7, label: '1 week' },
  { days: 21, label: '3 weeks' },
  { days: 30, label: '1 month' },
];

export function FeederDurationField({
  marker,
  idPrefix = 'days',
}: {
  marker: HuntMarker;
  idPrefix?: string;
}) {
  const { data, setFeederDuration } = useStore();
  const current = feederDurationDays(marker, data);
  const [value, setValue] = useState(String(current));
  const inputId = `${idPrefix}-${marker.id}`;

  useEffect(() => {
    setValue(String(current));
  }, [current, marker.id]);

  const commit = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
      setValue(String(current));
      return;
    }
    const days = Math.min(90, Math.round(n));
    setValue(String(days));
    if (days !== current) setFeederDuration(marker.id, days);
  };

  return (
    <div className="feeder-duration">
      <p className="feeder-duration-title">How long is this feeder full?</p>
      <p className="meta feeder-duration-help">
        Set days from a full fill until empty for <strong>{marker.name}</strong>.
        Some last about a week, others three weeks or a month. The low-corn
        warning uses this number.
      </p>
      <div className="chips" style={{ marginBottom: 10 }}>
        {DURATION_PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            className={`chip${current === p.days ? ' active' : ''}`}
            onClick={() => commit(String(p.days))}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={inputId}>Days from full to empty</label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={90}
          step={1}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => commit(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
    </div>
  );
}

export function FeederSettingsButton({
  marker,
  small = true,
}: {
  marker: HuntMarker;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data } = useStore();
  const days = feederDurationDays(marker, data);

  return (
    <>
      <button
        className={`btn ${small ? 'small' : ''}`}
        type="button"
        onClick={() => setOpen(true)}
      >
        Feeder settings · {days}d
      </button>
      {open && (
        <FeederSettingsModal marker={marker} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export function FeederSettingsModal({
  marker,
  onClose,
}: {
  marker: HuntMarker;
  onClose: () => void;
}) {
  return (
    <Modal title={`Feeder settings · ${marker.name}`} onClose={onClose}>
      <CornStatusLine marker={marker} />
      <div style={{ marginTop: 12 }}>
        <FeederDurationField marker={marker} idPrefix="settings-days" />
      </div>
      <CornFillHistory marker={marker} limit={5} />
      <div className="row" style={{ marginTop: 14 }}>
        <MarkFilledButton marker={marker} small={false} />
        <button className="btn ghost" type="button" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
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
