import { useRef, useState } from 'react';
import { exportFilename, parseImport } from '../storage';
import { useStore } from '../store';
import {
  DEFAULT_FULL_TO_EMPTY_DAYS,
  DEFAULT_CORN_WARN_MARGIN_DAYS,
} from '../corn';
import {
  getSyncSecret,
  hasBakedSyncSecret,
  setStoredSyncSecret,
} from '../sync';
import { Modal } from './Modal';
import { useSiteLock } from './SiteGate';

export function SettingsTab({
  admin,
  onUnlock,
  onLock,
}: {
  admin: boolean;
  onUnlock: () => void;
  onLock: () => void;
}) {
  const {
    data,
    setPin,
    restoreSuggestions,
    replaceAll,
    resetAll,
    setCornDefaults,
    syncStatus,
    syncDetail,
    refreshSync,
  } = useStore();
  const lockSite = useSiteLock();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState('');
  const [syncSecret, setSyncSecret] = useState(() => getSyncSecret());
  const [warnDays, setWarnDays] = useState(
    String(data.cornWarnDays ?? DEFAULT_FULL_TO_EMPTY_DAYS),
  );
  const [marginDays, setMarginDays] = useState(
    String(data.cornWarnMarginDays ?? DEFAULT_CORN_WARN_MARGIN_DAYS),
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename();
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded.');
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    try {
      const next = parseImport(text);
      replaceAll(next);
      setMsg('Backup imported. Data replaced.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not import backup.');
    }
  };

  return (
    <div className="page">
      <h2>Settings</h2>
      <p className="sub">
        Ranch data stays on this device as a cache and syncs live to Netlify
        Blobs when online.
      </p>

      <article className="card">
        <h3>Live sync</h3>
        <p className="meta">
          Status: <strong>{syncStatus}</strong>
          {syncDetail ? ` · ${syncDetail}` : ''}. Check-ins, check-outs,
          harvests, pin positions, and corn fills push after each change. Other
          devices poll every few seconds. The ranch sync secret is separate from
          the site access code (1808).
        </p>
        {hasBakedSyncSecret() ? (
          <p className="meta" style={{ marginTop: 8 }}>
            Client secret is set by <code>VITE_RANCH_SYNC_SECRET</code> at
            build time.
          </p>
        ) : (
          <>
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="sync-secret">Ranch sync secret</label>
              <input
                id="sync-secret"
                type="password"
                autoComplete="off"
                value={syncSecret}
                onChange={(e) => setSyncSecret(e.target.value)}
              />
            </div>
            <div className="row">
              <button
                className="btn small primary"
                type="button"
                onClick={() => {
                  setStoredSyncSecret(syncSecret);
                  refreshSync();
                  setMsg('Ranch sync secret saved on this device.');
                }}
              >
                Save secret
              </button>
              <button className="btn small" type="button" onClick={() => refreshSync()}>
                Sync now
              </button>
            </div>
          </>
        )}
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Corn defaults</h3>
        <p className="meta">
          Each feeder has its own full-to-empty days (edit on the pin or Blinds
          tab). These defaults apply to new feeders and as the fallback. Warn
          this many days before projected empty (never-filled feeders always
          warn).
        </p>
        <div className="field" style={{ marginTop: 10 }}>
          <label htmlFor="corn-days">Default full → empty (days)</label>
          <input
            id="corn-days"
            type="number"
            min={1}
            max={90}
            value={warnDays}
            onChange={(e) => setWarnDays(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="corn-margin">Warn before empty (days)</label>
          <input
            id="corn-margin"
            type="number"
            min={0}
            max={14}
            value={marginDays}
            onChange={(e) => setMarginDays(e.target.value)}
          />
        </div>
        <button
          className="btn small primary"
          type="button"
          onClick={() => {
            const days = Number(warnDays);
            const margin = Number(marginDays);
            if (!Number.isFinite(days) || days < 1) return;
            if (!Number.isFinite(margin) || margin < 0) return;
            setCornDefaults(days, margin);
            setMsg('Corn defaults saved and synced.');
          }}
        >
          Save corn defaults
        </button>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Site lock</h3>
        <p className="meta">
          Lock this browser session. Anyone using this device will need the
          site access code again (default 1808, or <code>VITE_SITE_PIN</code>).
          This does not change admin mode or the Admin PIN.
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" type="button" onClick={lockSite}>
            Lock
          </button>
        </div>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Admin mode</h3>
        <p className="meta">
          {admin
            ? 'Admin is ON. Drag, add, delete, and rename blinds & feeders on the map.'
            : 'Admin is OFF. View the map, check in, and log harvest only.'}
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          {admin ? (
            <button className="btn" type="button" onClick={onLock}>
              Turn admin off
            </button>
          ) : (
            <button className="btn primary" type="button" onClick={() => setPinOpen(true)}>
              Unlock admin
            </button>
          )}
        </div>
        {admin && (
          <>
            <div className="hr" />
            <div className="field">
              <label htmlFor="new-pin">Change Admin PIN</label>
              <input
                id="new-pin"
                inputMode="numeric"
                value={newPin}
                placeholder="New PIN"
                onChange={(e) => setNewPin(e.target.value)}
              />
            </div>
            <button
              className="btn small"
              type="button"
              disabled={newPin.trim().length < 4}
              onClick={() => {
                setPin(newPin.trim());
                setNewPin('');
                setMsg('Admin PIN updated.');
              }}
            >
              Save PIN
            </button>
          </>
        )}
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Layout</h3>
        <p className="meta">
          Restore Blind 1–7 and Feeder 1–7 on the current ranch map lanes.
          Occupied check-ins on stands are cleared.
        </p>
        <button
          className="btn"
          type="button"
          disabled={!admin}
          onClick={() => {
            if (confirm('Replace all blinds and feeders with the suggested layout?')) {
              restoreSuggestions();
              setMsg('Suggested layout restored.');
            }
          }}
        >
          Restore suggested layout
        </button>
        {!admin && (
          <p className="meta" style={{ marginTop: 8 }}>
            Unlock admin to restore the layout.
          </p>
        )}
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Backup</h3>
        <p className="meta">
          Saved in this device’s localStorage and IndexedDB, and synced to the
          ranch Blobs store when online. Export JSON for a spare copy; import to
          restore (then it pushes to other devices).
        </p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" type="button" onClick={exportJson}>
            Export JSON
          </button>
          <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>Reset</h3>
        <p className="meta">
          Wipe this device back to the v1 defaults (Admin PIN 1234). Site access
          code is unchanged.
        </p>
        <button
          className="btn danger"
          type="button"
          onClick={() => {
            if (confirm('Reset all ranch hunt data on this device?')) {
              resetAll();
              onLock();
              setMsg('Reset complete.');
            }
          }}
        >
          Reset all data
        </button>
      </article>

      <article className="card" style={{ marginTop: 12 }}>
        <h3>iPad · Add to Home Screen</h3>
        <div className="help">
          <ol>
            <li>Open this app in Safari.</li>
            <li>Tap the Share button.</li>
            <li>Tap <strong>Add to Home Screen</strong>, then Add.</li>
          </ol>
          <p>
            The ranch map is bundled for offline use after the first load. Pinch-zoom
            and pan work on the Map tab. Page zoom is disabled so the map keeps the
            gestures.
          </p>
        </div>
      </article>

      {msg && (
        <p className="meta" style={{ marginTop: 14 }}>
          {msg}
        </p>
      )}

      {pinOpen && (
        <Modal title="Admin PIN" onClose={() => setPinOpen(false)}>
          <p className="meta">
            Admin PIN (default 1234 until you change it in Settings). This is
            not the site access code.
          </p>
          <div className="field">
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => {
                setPinValue(e.target.value);
                setPinError('');
              }}
              autoFocus
            />
          </div>
          {pinError ? <p className="pin-error">{pinError}</p> : null}
          <div className="row">
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                if (pin.trim() === data.pin) {
                  onUnlock();
                  setPinOpen(false);
                  setPinValue('');
                  setPinError('');
                } else {
                  setPinError('Incorrect PIN.');
                }
              }}
            >
              Unlock
            </button>
            <button className="btn ghost" type="button" onClick={() => setPinOpen(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
