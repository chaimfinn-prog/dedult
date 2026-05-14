import type { NewsItem } from './types';

type Translated = { titleHe: string; summaryHe: string };

const cache = new Map<string, Translated>();
const CACHE_MAX = 500;

function cacheKey(item: NewsItem): string {
  return item.uuid || item.link;
}

function setCache(key: string, value: Translated) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, value);
}

export function hasTranslationKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
};

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const block = data.content?.find((c) => c.type === 'text');
  return (block?.text ?? '').trim();
}

function buildPrompt(item: NewsItem): string {
  const summary = item.summary ?? '';
  return `אתה מתרגם ומסכם כתבות חדשות פיננסיות מאנגלית לעברית.
קבל את הכותרת והתקציר הבאים והפק JSON תקני בלבד עם שני שדות:
- "titleHe": תרגום נאמן וקצר של הכותרת לעברית.
- "summaryHe": תקציר עברי בהיר באורך 2–3 משפטים, מבוסס על התקציר; אם התקציר חסר או דליל, תקצר את הכותרת בלבד.

החזר JSON בלבד, ללא טקסט נוסף, ללא markdown.

Title: ${item.title}
Summary: ${summary}`;
}

function parseJson(text: string): Translated | null {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as Partial<Translated>;
    if (typeof obj.titleHe !== 'string' || typeof obj.summaryHe !== 'string') return null;
    return { titleHe: obj.titleHe, summaryHe: obj.summaryHe };
  } catch {
    return null;
  }
}

export async function translateNewsItem(item: NewsItem): Promise<NewsItem> {
  if (!hasTranslationKey()) return item;
  const key = cacheKey(item);
  const cached = cache.get(key);
  if (cached) {
    return { ...item, titleHe: cached.titleHe, summaryHe: cached.summaryHe, translated: true };
  }
  try {
    const out = await callClaude(buildPrompt(item));
    const parsed = parseJson(out);
    if (!parsed) return item;
    setCache(key, parsed);
    return { ...item, titleHe: parsed.titleHe, summaryHe: parsed.summaryHe, translated: true };
  } catch {
    return item;
  }
}

export async function translateNewsItems(items: NewsItem[]): Promise<NewsItem[]> {
  if (!hasTranslationKey() || items.length === 0) return items;
  return Promise.all(items.map((it) => translateNewsItem(it)));
}
