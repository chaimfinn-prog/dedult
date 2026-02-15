import enRisk from './en/risk.json';
import heRisk from './he/risk.json';

const dictionaries = {
  he: heRisk,
  en: enRisk,
} as const;

type Locale = keyof typeof dictionaries;

function getPathValue(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  return key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj) as string | undefined;
}

export function t(key: string, locale: string): string {
  const safeLocale: Locale = locale === 'en' ? 'en' : 'he';
  const localized = getPathValue(dictionaries[safeLocale], key);

  if (localized) {
    return localized;
  }

  return getPathValue(dictionaries.en, key) ?? key;
}
