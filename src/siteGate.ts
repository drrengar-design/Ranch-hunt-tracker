export const SITE_UNLOCK_KEY = 'ranchHuntSiteUnlocked';
export const DEFAULT_SITE_PIN = '1234';

export function getSitePin(): string {
  const fromEnv = import.meta.env.VITE_SITE_PIN;
  return typeof fromEnv === 'string' && fromEnv.length > 0
    ? fromEnv
    : DEFAULT_SITE_PIN;
}

export function isSiteUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SITE_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockSite(): void {
  sessionStorage.setItem(SITE_UNLOCK_KEY, '1');
}

export function lockSite(): void {
  sessionStorage.removeItem(SITE_UNLOCK_KEY);
}
