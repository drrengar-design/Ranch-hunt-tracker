import { useState } from 'react';
import type { Season } from '../types';
import { useStore } from '../store';
import { Modal } from './Modal';

function SeasonForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Season;
  onSave: (s: Season) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');

  return (
    <Modal title={initial ? 'Edit season' : 'New season'} onClose={onClose}>
      <div className="field">
        <label htmlFor="s-name">Name</label>
        <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="s-start">Start</label>
        <input
          id="s-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="s-end">End</label>
        <input
          id="s-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div className="row">
        <button
          className="btn primary"
          type="button"
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              id: initial?.id ?? crypto.randomUUID(),
              name: name.trim(),
              startDate,
              endDate,
            })
          }
        >
          Save
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function SeasonsTab({ admin }: { admin: boolean }) {
  const { data, addSeason, updateSeason, deleteSeason, setActiveSeason } = useStore();
  const [editing, setEditing] = useState<Season | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="page">
      <h2>Seasons</h2>
      <p className="sub">Occupancy and harvest attach to the active season.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn primary" type="button" onClick={() => setCreating(true)}>
          New season
        </button>
      </div>
      <div className="list">
        {data.seasons.map((s) => {
          const active = s.id === data.activeSeasonId;
          const harvests = data.harvests.filter((h) => h.seasonId === s.id).length;
          const occupied = data.checkIns.filter(
            (c) => c.seasonId === s.id && !c.outAt,
          ).length;
          return (
            <article className="card" key={s.id}>
              <div className="row spread">
                <h3>{s.name}</h3>
                {active && <span className="status open">Active</span>}
              </div>
              <p className="meta">
                {s.startDate || '—'} → {s.endDate || '—'} · {harvests} harvest
                {harvests === 1 ? '' : 's'} · {occupied} in the field
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                {!active && (
                  <button className="btn small primary" type="button" onClick={() => setActiveSeason(s.id)}>
                    Set active
                  </button>
                )}
                {admin && (
                  <button className="btn small" type="button" onClick={() => setEditing(s)}>
                    Rename / dates
                  </button>
                )}
                {admin && data.seasons.length > 1 && (
                  <button
                    className="btn small danger"
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${s.name} and its harvest/check-in history?`)) {
                        deleteSeason(s.id);
                      }
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

      {creating && (
        <SeasonForm
          onClose={() => setCreating(false)}
          onSave={(s) => {
            addSeason(s);
            setCreating(false);
          }}
        />
      )}
      {editing && (
        <SeasonForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            updateSeason(s);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
