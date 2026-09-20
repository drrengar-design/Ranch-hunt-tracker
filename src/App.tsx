import { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { ADMIN_SESSION_KEY } from './storage';
import type { TabId } from './types';
import { TabBar } from './components/TabBar';
import { MapView } from './components/MapView';
import { BlindsTab } from './components/BlindsTab';
import { SeasonsTab } from './components/SeasonsTab';
import { HarvestTab } from './components/HarvestTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { SiteGate } from './components/SiteGate';

function Shell() {
  const { ready, activeSeason } = useStore();
  const [tab, setTab] = useState<TabId>('map');
  const [admin, setAdmin] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1',
  );

  const unlock = useCallback(() => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    setAdmin(true);
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdmin(false);
  }, []);

  useEffect(() => {
    if (tab === 'map') {
      /* MapView invalidates size itself */
    }
  }, [tab]);

  if (!ready) {
    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <img
              className="brand-logo"
              src="/rancho-1808-logo.jpg"
              alt=""
            />
            <div className="brand-text">
              <h1>Ranch Hunt</h1>
              <span>Loading…</span>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <img
            className="brand-logo"
            src="/rancho-1808-logo.jpg"
            alt=""
          />
          <div className="brand-text">
            <h1>Ranch Hunt</h1>
            <span>{activeSeason?.name ?? 'No season'}</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={`badge${admin ? ' on' : ''}`}
            onClick={() => (admin ? lock() : setTab('settings'))}
          >
            <span className="dot" />
            {admin ? 'Admin ON' : 'Admin OFF'}
          </button>
        </div>
      </header>

      <main className="content">
        <div className={`map-host${tab === 'map' ? '' : ' hidden-map'}`}>
          <MapView show={tab === 'map'} admin={admin} />
        </div>
        {tab === 'blinds' && <BlindsTab admin={admin} />}
        {tab === 'seasons' && <SeasonsTab admin={admin} />}
        {tab === 'harvest' && <HarvestTab admin={admin} />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'settings' && (
          <SettingsTab admin={admin} onUnlock={unlock} onLock={lock} />
        )}
      </main>

      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <SiteGate>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SiteGate>
  );
}
