'use client';
import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  language: 'vi' | 'en';
  category: 'politics' | 'policy' | 'international' | 'us-politics' | 'tech-policy' | 'tech-news' | 'ai' | 'law' | 'tech-deals' | 'startups';
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
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const url = searchKeyword 
          ? `/api/news?q=${encodeURIComponent(searchKeyword)}`
          : '/api/news';
        const res = await fetch(url);
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
  }, [searchKeyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(keyword.trim());
  };

  const handleReset = () => {
    setKeyword('');
    setSearchKeyword('');
  };

  return (
    <div className="card">
      <h2>
        News 24h{' '}
        {data?.stale && <span className="badge warn">May be stale</span>}
      </h2>
      
      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search news..."
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
        {searchKeyword && (
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        )}
      </form>

      {searchKeyword && (
        <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
          Results for: <strong>{searchKeyword}</strong>
        </p>
      )}

      {!data ? (
        <p className="muted">Loading…</p>
      ) : data.items.length === 0 ? (
        <p className="muted">No news in the last 24 hours.</p>
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
