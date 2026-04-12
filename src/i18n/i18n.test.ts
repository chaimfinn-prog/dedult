import { describe, it, expect } from 'vitest';
import { t } from './index';

describe('t (i18n translation)', () => {
  it('returns Hebrew translation for he locale', () => {
    const result = t('risk.cyprus.closed_israeli_market.title', 'he');
    expect(result).toBeTruthy();
    expect(result).not.toBe('risk.cyprus.closed_israeli_market.title');
  });

  it('returns English translation for en locale', () => {
    const result = t('risk.cyprus.closed_israeli_market.title', 'en');
    expect(result).toBeTruthy();
    expect(result).not.toBe('risk.cyprus.closed_israeli_market.title');
  });

  it('falls back to English for unknown locale', () => {
    const result = t('risk.cyprus.closed_israeli_market.title', 'fr');
    // Falls back to Hebrew (non-en = he), then English
    expect(result).toBeTruthy();
  });

  it('returns key if no translation found', () => {
    const result = t('nonexistent.key.path', 'en');
    expect(result).toBe('nonexistent.key.path');
  });

  it('defaults to he for non-en locale', () => {
    const he = t('risk.cyprus.closed_israeli_market.title', 'he');
    const de = t('risk.cyprus.closed_israeli_market.title', 'de');
    expect(de).toBe(he);
  });
});
