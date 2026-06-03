'use client';
import { useEffect, useState } from 'react';

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  weatherDesc: string;
}

interface WeatherResult {
  city: string;
  days: WeatherDay[];
  stale: boolean;
}

const dtf = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

export function WeatherWidget() {
  const [data, setData] = useState<WeatherResult | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/weather');
        const j = (await res.json()) as WeatherResult;
        if (alive) setData(j);
      } catch {
        if (alive) setData({ city: 'Hà Nội', days: [], stale: false });
      }
    }
    load();
    // Refresh every hour
    const t = setInterval(load, 60 * 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="card">
      <h2>
        Weather Hanoi{' '}
        {data?.stale && <span className="badge warn">May be stale</span>}
      </h2>
      {!data ? (
        <p className="muted">Loading…</p>
      ) : data.days.length === 0 ? (
        <p className="muted">No weather data available.</p>
      ) : (
        <div className="weather-scroll-container">
          <div className="weather-days-horizontal">
            {data.days.map((day) => {
              const date = new Date(day.date);
              return (
                <div key={day.date} className="weather-day-card">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {dtf.format(date)}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, margin: '8px 0' }}>
                    {day.tempMax}°
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    {day.tempMin}° min
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    {day.weatherDesc}
                  </div>
                  {day.precipitation > 0 && (
                    <div className="muted" style={{ fontSize: 11 }}>
                      🌧️ {day.precipitation}mm
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
