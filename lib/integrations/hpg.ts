// Lấy giá HPG từ VnDirect public API. Cache trong RAM 60 giây.

export interface HpgQuote {
  symbol: 'HPG';
  price: number; // close price (đơn vị nghìn VND như VnDirect trả về)
  change: number;
  changePercent: number;
  volume: number;
  asOfTime: Date;
  source: 'VnDirect';
}

export type HpgQuoteResult =
  | { ok: true; quote: HpgQuote; stale: boolean }
  | { ok: false; reason: 'unavailable' };

const CACHE_TTL_MS = 60_000;
let cached: { quote: HpgQuote; fetchedAt: number } | null = null;

async function fetchFromVnDirect(): Promise<HpgQuote> {
  const url =
    'https://api-finfo.vndirect.com.vn/v4/stock_prices?q=code:HPG&size=1&sort=date:desc';
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`VnDirect responded ${res.status}`);
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const row = json.data?.[0];
    if (!row) throw new Error('VnDirect payload missing data');

    const price = Number(row.close);
    const change = Number(row.change ?? 0);
    const changePercent = Number(row.pctChange ?? 0);
    const volume = Number(row.nmVolume ?? 0);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error('VnDirect payload invalid price');
    }

    return {
      symbol: 'HPG',
      price,
      change,
      changePercent,
      volume,
      asOfTime: new Date(),
      source: 'VnDirect',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getHpgQuote(now: Date = new Date()): Promise<HpgQuoteResult> {
  if (cached && now.getTime() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ok: true, quote: cached.quote, stale: false };
  }
  try {
    const quote = await fetchFromVnDirect();
    cached = { quote, fetchedAt: now.getTime() };
    return { ok: true, quote, stale: false };
  } catch (err) {
    console.warn('[hpg] fetch failed:', (err as Error).message);
    if (cached) return { ok: true, quote: cached.quote, stale: true };
    return { ok: false, reason: 'unavailable' };
  }
}
