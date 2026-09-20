import {
  createContext,
  useCallback,
  useContext,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  getSitePin,
  isSiteUnlocked,
  lockSite,
  unlockSite,
} from '../siteGate';

const SiteGateContext = createContext<{ lock: () => void } | null>(null);

export function useSiteLock(): () => void {
  const ctx = useContext(SiteGateContext);
  if (!ctx) throw new Error('useSiteLock must be used within SiteGate');
  return ctx.lock;
}

export function SiteGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => isSiteUnlocked());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const lock = useCallback(() => {
    lockSite();
    setUnlocked(false);
    setCode('');
    setError('');
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim() === getSitePin()) {
      unlockSite();
      setUnlocked(true);
      setCode('');
      setError('');
      return;
    }
    setError('Incorrect code.');
  };

  if (unlocked) {
    return (
      <SiteGateContext.Provider value={{ lock }}>
        {children}
      </SiteGateContext.Provider>
    );
  }

  return (
    <div className="site-gate">
      <form className="site-gate-card" onSubmit={onSubmit}>
        <div className="site-gate-logo-wrap">
          <img
            className="site-gate-logo"
            src="/rancho-1808-logo.jpg"
            alt="Rancho 1808"
          />
        </div>
        <p className="site-gate-kicker">Ranch Hunt Tracker</p>
        <h1>Enter site code</h1>
        <p className="site-gate-copy">
          This iPad app is for ranch use. Enter the access code to continue.
        </p>
        <div className="field">
          <label htmlFor="site-code">Code</label>
          <input
            id="site-code"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
          />
        </div>
        {error ? <p className="pin-error">{error}</p> : null}
        <button className="btn primary site-gate-submit" type="submit">
          Unlock
        </button>
      </form>
    </div>
  );
}
