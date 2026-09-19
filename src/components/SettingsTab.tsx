import { useRef, useState } from 'react';
import { exportFilename, parseImport } from '../storage';
import { useStore } from '../store';
import { Modal } from './Modal';

export function SettingsTab({
  admin,
  onUnlock,
  onLock,
}: {
  admin: boolean;
  onUnlock: () => void;
  onLock: () => void;
}) {
  const { data, setPin, restoreSuggestions, replaceAll, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [msg, setMsg] = useState('');

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
      <p className="sub">Local ranch iPad app. Nothing is uploaded.</p>

      <article className="card">
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
              <label htmlFor="new-pin">Change PIN</label>
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
                setMsg('PIN updated.');
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
          Restore the suggested blinds and feeders on lanes, overlooking Laguna,
          clear of the well/camp. Occupied check-ins on stands are cleared.
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
          Saved in this device’s localStorage and IndexedDB. Export JSON for a
          spare copy; import to restore.
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
        <p className="meta">Wipe this device back to the v1 defaults (PIN 1234).</p>
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
          <p className="meta">Default PIN is 1234 until you change it.</p>
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
