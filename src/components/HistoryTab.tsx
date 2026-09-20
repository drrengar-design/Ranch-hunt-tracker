import { useMemo, useState } from 'react';
import {
  downloadTextFile,
  historyCsvFilename,
  historyRowsToCsv,
  type HistoryCsvRow,
} from '../historyCsv';
import { formatWhen, useStore } from '../store';

const ALL = 'all';

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

export function HistoryTab() {
  const { data } = useStore();
  const [blindId, setBlindId] = useState(ALL);
  const [hunter, setHunter] = useState(ALL);
  const [seasonId, setSeasonId] = useState(ALL);

  const markerName = (id: string) =>
    data.markers.find((m) => m.id === id)?.name ?? 'Unknown';
  const seasonName = (id: string) =>
    data.seasons.find((s) => s.id === id)?.name ?? 'Unknown';

  const blindOptions = useMemo(() => {
    const fromMarkers = data.markers
      .filter((m) => m.kind === 'blind')
      .map((m) => ({ id: m.id, name: m.name }));
    const seen = new Set(fromMarkers.map((m) => m.id));
    const extras = data.checkIns
      .filter((c) => !seen.has(c.markerId))
      .map((c) => ({
        id: c.markerId,
        name: data.markers.find((m) => m.id === c.markerId)?.name ?? 'Unknown',
      }));
    const merged = [...fromMarkers, ...extras];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
    return merged.filter(
      (opt, i) => merged.findIndex((o) => o.id === opt.id) === i,
    );
  }, [data.checkIns, data.markers]);

  const hunterOptions = useMemo(
    () => uniqueSorted(data.checkIns.map((c) => c.hunterName.trim())),
    [data.checkIns],
  );

  const rows = useMemo(() => {
    return [...data.checkIns]
      .filter((c) => blindId === ALL || c.markerId === blindId)
      .filter((c) => hunter === ALL || c.hunterName.trim() === hunter)
      .filter((c) => seasonId === ALL || c.seasonId === seasonId)
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [blindId, data.checkIns, hunter, seasonId]);

  const csvRows: HistoryCsvRow[] = rows.map((c) => ({
    blind: markerName(c.markerId),
    hunter: c.hunterName,
    inAt: formatWhen(c.at),
    outAt: c.outAt ? formatWhen(c.outAt) : 'Open',
    season: seasonName(c.seasonId),
  }));

  const exportCsv = () => {
    downloadTextFile(historyCsvFilename(), historyRowsToCsv(csvRows));
  };

  const noData = data.checkIns.length === 0;
  const noMatches = !noData && rows.length === 0;

  return (
    <div className="page">
      <h2>History</h2>
      <p className="sub">Every check-in on this device, newest first.</p>

      <div className="history-filters">
        <div className="field">
          <label htmlFor="hist-blind">Blind</label>
          <select
            id="hist-blind"
            value={blindId}
            onChange={(e) => setBlindId(e.target.value)}
          >
            <option value={ALL}>All blinds</option>
            {blindOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hist-hunter">Hunter</label>
          <select
            id="hist-hunter"
            value={hunter}
            onChange={(e) => setHunter(e.target.value)}
          >
            <option value={ALL}>All hunters</option>
            {hunterOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hist-season">Season</label>
          <select
            id="hist-season"
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            <option value={ALL}>All seasons</option>
            {data.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row spread" style={{ marginBottom: 12 }}>
        <p className="meta" style={{ margin: 0 }}>
          {rows.length} {rows.length === 1 ? 'check-in' : 'check-ins'}
        </p>
        <button
          className="btn small primary"
          type="button"
          disabled={rows.length === 0}
          onClick={exportCsv}
        >
          Download CSV
        </button>
      </div>

      {noData && (
        <article className="card">
          <p className="meta" style={{ margin: 0 }}>
            No check-ins yet. Check in from the Blinds tab or a map pin, then
            they will show up here.
          </p>
        </article>
      )}

      {noMatches && (
        <article className="card">
          <p className="meta" style={{ margin: 0 }}>
            No check-ins match these filters.
          </p>
        </article>
      )}

      {rows.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th scope="col">Blind</th>
                <th scope="col">Hunter</th>
                <th scope="col">In</th>
                <th scope="col">Out</th>
                <th scope="col">Season</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{markerName(c.markerId)}</td>
                  <td>{c.hunterName}</td>
                  <td>{formatWhen(c.at)}</td>
                  <td>
                    {c.outAt ? (
                      formatWhen(c.outAt)
                    ) : (
                      <span className="status open">Open</span>
                    )}
                  </td>
                  <td>{seasonName(c.seasonId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
