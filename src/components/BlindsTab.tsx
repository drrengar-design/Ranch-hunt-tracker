import { useState } from 'react';
import { formatWhen, useStore } from '../store';
import { HarvestForm } from './MapView';
import { Modal } from './Modal';
import type { HuntMarker } from '../types';

function CheckInModal({
  marker,
  onClose,
}: {
  marker: HuntMarker;
  onClose: () => void;
}) {
  const { checkIn, data } = useStore();
  const [name, setName] = useState(data.hunterRoster[0] ?? '');
  return (
    <Modal title={`Check in · ${marker.name}`} onClose={onClose}>
      <div className="field">
        <label htmlFor="b-hunter">Hunter</label>
        <input
          id="b-hunter"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="chips" style={{ marginBottom: 12 }}>
        {data.hunterRoster.map((h) => (
          <button key={h} type="button" className="chip" onClick={() => setName(h)}>
            {h}
          </button>
        ))}
      </div>
      <div className="row">
        <button
          className="btn primary"
          type="button"
          disabled={!name.trim()}
          onClick={() => {
            checkIn(marker.id, name);
            onClose();
          }}
        >
          Check in
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function BlindsTab({ admin }: { admin: boolean }) {
  const { blinds, feeders, occupantOf, checkOut, deleteMarker } = useStore();
  const [checkIn, setCheckIn] = useState<HuntMarker | null>(null);
  const [harvestFor, setHarvestFor] = useState<string | null>(null);

  return (
    <div className="page">
      <h2>Blinds &amp; feeders</h2>
      <p className="sub">
        Suggested stands sit on hunting lanes, overlook Laguna, and stay clear
        of the well/camp at the western access.
      </p>

      <h3 style={{ margin: '0 0 8px' }}>Blinds</h3>
      <div className="list">
        {blinds.map((b) => {
          const occ = occupantOf(b.id);
          return (
            <article className="card" key={b.id}>
              <div className="row spread">
                <h3>{b.name}</h3>
                <span className={`status ${occ ? 'busy' : 'open'}`}>
                  {occ ? occ.hunterName : 'Open'}
                </span>
              </div>
              {b.notes ? <p className="meta">{b.notes}</p> : null}
              {occ ? (
                <p className="meta">In since {formatWhen(occ.at)}</p>
              ) : null}
              <div className="row" style={{ marginTop: 10 }}>
                {!admin && !occ && (
                  <button className="btn small primary" type="button" onClick={() => setCheckIn(b)}>
                    Check in
                  </button>
                )}
                {!admin && occ && (
                  <button className="btn small" type="button" onClick={() => checkOut(b.id)}>
                    Check out
                  </button>
                )}
                {!admin && (
                  <button className="btn small" type="button" onClick={() => setHarvestFor(b.id)}>
                    Harvest
                  </button>
                )}
                {admin && (
                  <button
                    className="btn small danger"
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${b.name}?`)) deleteMarker(b.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <h3 style={{ margin: '18px 0 8px' }}>Feeders</h3>
      <div className="list">
        {feeders.map((f) => (
          <article className="card" key={f.id}>
            <div className="row spread">
              <h3>{f.name}</h3>
              {admin && (
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete ${f.name}?`)) deleteMarker(f.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            {f.notes ? <p className="meta">{f.notes}</p> : null}
          </article>
        ))}
      </div>

      {checkIn && <CheckInModal marker={checkIn} onClose={() => setCheckIn(null)} />}
      {harvestFor && (
        <HarvestForm presetMarkerId={harvestFor} onClose={() => setHarvestFor(null)} />
      )}
    </div>
  );
}
