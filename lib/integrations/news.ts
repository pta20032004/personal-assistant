// Lấy tin Google News RSS theo từ khóa chính trị / chính sách (vi + en).
// Cache 10 phút trong RAM. Có lỗi -> trả mảng rỗng (đủ cho personal app).
import { XMLParser } from 'fast-xml-parser';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  language: 'vi' | 'en';
  category: 'politics' | 'policy';
}

export interface NewsResult {
  items: NewsItem[];
  stale: boolean;
}

interface Query {
  q: string;
  language: 'vi' | 'en';
  category: 'politics' | 'policy';
  hl: string;
  gl: string;
  ceid: string;
}

const QUERIES: Query[] = [
  { q: 'chính trị Việt Nam', language: 'vi', category: 'politics', hl: 'vi', gl: 'VN', ceid: 'VN:vi' },
  { q: 'chính sách Việt Nam', language: 'vi', category: 'policy', hl: 'vi', gl: 'VN', ceid: 'VN:vi' },
  { q: 'Vietnam politics', language: 'en', category: 'politics', hl: 'en', gl: 'US', ceid: 'US:en' },
  { q: 'Vietnam policy', language: 'en', category: 'policy', hl: 'en', gl: 'US', ceid: 'US:en' },
];

const CACHE_TTL_MS = 10 * 60_000;
const WINDOW_MS = 24 * 60 * 60_000;
const MAX_ITEMS = 20;

let cached: { result: NewsResult; fetchedAt: number } | null = null;

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchOne(q: Query, signal: AbortSignal): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    q.q,
  )}+when:1d&hl=${q.hl}&gl=${q.gl}&ceid=${q.ceid}`;
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`Google News responded ${res.status}`);
  const xml = await res.text();
  const data = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const channel = data.rss?.channel;
  const rawItems = !channel?.item
    ? []
    : Array.isArray(channel.item)
      ? channel.item
      : [channel.item];

  const items: NewsItem[] = [];
  for (const raw of rawItems as Array<Record<string, unknown>>) {
    const link = typeof raw.link === 'string' ? raw.link : '';
    const title = typeof raw.title === 'string' ? raw.title : '';
    const pubDateStr = typeof raw.pubDate === 'string' ? raw.pubDate : '';
    const sourceObj = raw.source as { '#text'?: string } | string | undefined;
    const source =
      typeof sourceObj === 'string'
        ? sourceObj
        : typeof sourceObj?.['#text'] === 'string'
          ? sourceObj['#text']
          : '';
    if (!link || !title || !pubDateStr) continue;
    const publishedAt = new Date(pubDateStr);
    if (Number.isNaN(publishedAt.getTime())) continue;
    items.push({
      id: link,
      title,
      url: link,
      source,
      publishedAt,
      language: q.language,
      category: q.category,
    });
  }
  return items;
}

export async function getRecentNews(now: Date = new Date()): Promise<NewsResult> {
  if (cached && now.getTime() - cached.fetchedAt < CACHE_TTL_MS) {
    return { items: cached.result.items, stale: false };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const settled = await Promise.allSettled(QUERIES.map((q) => fetchOne(q, ac.signal)));
    const all: NewsItem[] = [];
    for (const r of settled) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }

    if (all.length === 0 && settled.every((r) => r.status === 'rejected')) {
      // Toàn bộ upstream lỗi -> dùng cache nếu có.
      if (cached) return { items: cached.result.items, stale: true };
      return { items: [], stale: false };
    }

    const cutoff = now.getTime() - WINDOW_MS;
    const filtered = all.filter((it) => it.publishedAt.getTime() >= cutoff);

    // Dedupe theo url, giữ publishedAt mới nhất.
    const byUrl = new Map<string, NewsItem>();
    for (const it of filtered) {
      const existing = byUrl.get(it.url);
      if (!existing || it.publishedAt.getTime() > existing.publishedAt.getTime()) {
        byUrl.set(it.url, it);
      }
    }
    const sorted = [...byUrl.values()].sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );
    const items = sorted.slice(0, MAX_ITEMS);

    const result: NewsResult = { items, stale: false };
    cached = { result, fetchedAt: now.getTime() };
    return result;
  } catch (err) {
    console.warn('[news] fetch failed:', (err as Error).message);
    if (cached) return { items: cached.result.items, stale: true };
    return { items: [], stale: false };
  } finally {
    clearTimeout(timer);
  }
}
