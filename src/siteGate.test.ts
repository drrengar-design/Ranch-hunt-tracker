import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_PIN, getSitePin } from './siteGate';

describe('site access pin', () => {
  it('defaults to 5858', () => {
    expect(DEFAULT_SITE_PIN).toBe('5858');
    const fromEnv = import.meta.env.VITE_SITE_PIN;
    if (typeof fromEnv !== 'string' || fromEnv.length === 0) {
      expect(getSitePin()).toBe('5858');
    }
  });

  it('does not accept the previous site codes as the built-in default', () => {
    expect(DEFAULT_SITE_PIN).not.toBe('1808');
    expect(DEFAULT_SITE_PIN).not.toBe('035758');
    expect('5858'.trim() === DEFAULT_SITE_PIN).toBe(true);
    expect('1808'.trim() === DEFAULT_SITE_PIN).toBe(false);
    expect('035758'.trim() === DEFAULT_SITE_PIN).toBe(false);
  });
});
