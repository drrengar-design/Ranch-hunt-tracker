import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { HarvestForm } from './MapView';

export function HarvestTab({ admin }: { admin: boolean }) {
  const { data, blinds, deleteHarvest } = useStore();
  const [open, setOpen] = useState(false);
  const harvests = data.harvests.filter((h) => h.seasonId === data.activeSeasonId);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of harvests) {
      map.set(h.species, (map.get(h.species) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [harvests]);

  const nameOf = (id?: string) => {
    if (!id) return 'Field / other';
    if (id === 'laguna') return 'Laguna';
    return blinds.find((b) => b.id === id)?.name ?? 'Unknown stand';
  };

  return (
    <div className="page">
      <h2>Harvest log</h2>
      <p className="sub">Entries for the active season.</p>
      <div className="stats">
        <div className="stat">
          <b>{harvests.length}</b>
          <span>Total</span>
        </div>
        <div className="stat">
          <b>{counts[0]?.[1] ?? 0}</b>
          <span>{counts[0]?.[0] ?? 'Top species'}</span>
        </div>
        <div className="stat">
          <b>{new Set(harvests.map((h) => h.hunterName)).size}</b>
          <span>Hunters</span>
        </div>
      </div>
      {!admin && (
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn primary" type="button" onClick={() => setOpen(true)}>
            Log harvest
          </button>
        </div>
      )}
      {admin && (
        <p className="meta" style={{ marginTop: 0 }}>
          Turn Admin OFF to log a harvest. Admin is for moving and naming stands.
        </p>
      )}
      <div className="list">
        {harvests.length === 0 && (
          <article className="card">
            <p className="meta" style={{ margin: 0 }}>
              No harvests logged this season yet.
            </p>
          </article>
        )}
        {harvests.map((h) => (
          <article className="card" key={h.id}>
            <div className="row spread">
              <h3>{h.species}</h3>
              <span className="meta">{h.date}</span>
            </div>
            <p className="meta">
              {h.hunterName}
              {h.sex !== 'unknown' ? ` · ${h.sex}` : ''} · {nameOf(h.markerId)}
            </p>
            {h.notes ? <p className="meta">{h.notes}</p> : null}
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn small danger"
                type="button"
                onClick={() => {
                  if (confirm('Delete this harvest entry?')) deleteHarvest(h.id);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {open && <HarvestForm onClose={() => setOpen(false)} />}
    </div>
  );
}
