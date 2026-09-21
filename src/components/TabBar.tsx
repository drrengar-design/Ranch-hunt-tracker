import type { ReactNode } from 'react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: 'map',
    label: 'Map',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    ),
  },
  {
    id: 'blinds',
    label: 'Blinds',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10l8-6 8 6v10" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
  {
    id: 'seasons',
    label: 'Seasons',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    id: 'regs',
    label: 'Regs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 4h9a2 2 0 012 2v14H8a3 3 0 01-3-3V6a2 2 0 012-2z" />
        <path d="M5 19a2 2 0 012-2h13" />
        <path d="M10 9h6M10 13h6" />
      </svg>
    ),
  },
  {
    id: 'harvest',
    label: 'Harvest',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
      </svg>
    ),
  },
];

export function TabBar({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <nav className="tabs" aria-label="Primary">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab${tab === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  );
}
