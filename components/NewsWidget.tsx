'use client';
import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  language: 'vi' | 'en';
  category: 'politics' | 'policy';
}
interface Result {
  items: NewsItem[];
  stale: boolean;
}

const dtf = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

export function NewsWidget() {
  const [data, setData] = useState<Result | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/news');
        const j = (await res.json()) as Result;
        if (alive) setData(j);
      } catch {
        if (alive) setData({ items: [], stale: false });
      }
    }
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="card">
      <h2>
        Tin tức 24h{' '}
        {data?.stale && <span className="badge warn">Có thể cũ</span>}
      </h2>
      {!data ? (
        <p className="muted">Đang tải…</p>
      ) : data.items.length === 0 ? (
        <p className="muted">Chưa có tin trong 24h qua.</p>
      ) : (
        <ul className="list" style={{ maxHeight: 360, overflow: 'auto' }}>
          {data.items.map((it) => (
            <li key={it.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={it.url} target="_blank" rel="noopener noreferrer">
                  {it.title}
                </a>
                <div className="muted" style={{ fontSize: 11 }}>
                  {it.source} · {dtf.format(new Date(it.publishedAt))} ·{' '}
                  <span className="badge">{it.category}</span>{' '}
                  <span className="badge">{it.language}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
