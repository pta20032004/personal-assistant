'use client';
import { useEffect, useState } from 'react';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  asOfTime: string;
  source: string;
}
type Result =
  | { ok: true; quote: Quote; stale: boolean }
  | { ok: false; reason: string };

export function HpgWidget() {
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/hpg');
        const j = (await res.json()) as Result;
        if (alive) setData(j);
      } catch {
        if (alive) setData({ ok: false, reason: 'unavailable' });
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!data) {
    return (
      <div className="card">
        <h2>HPG Stock</h2>
        <p className="muted">Loading…</p>
      </div>
    );
  }
  if (!data.ok) {
    return (
      <div className="card">
        <h2>HPG Stock</h2>
        <p className="muted">No price data available.</p>
      </div>
    );
  }
  const { quote, stale } = data;
  const up = quote.change >= 0;
  return (
    <div className="card">
      <h2>HPG Stock</h2>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {(quote.price * 1000).toLocaleString('en-US')} ₫
        </div>
        <span className={`badge ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {(Math.abs(quote.change) * 1000).toLocaleString('en-US')} ₫ (
          {quote.changePercent.toFixed(2)}%)
        </span>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        Volume: {quote.volume.toLocaleString('en-US')} · Source: {quote.source}
        {stale && <span className="badge warn" style={{ marginLeft: 8 }}>May be stale</span>}
      </div>
    </div>
  );
}
