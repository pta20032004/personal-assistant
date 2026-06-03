// Lấy dự báo thời tiết Hà Nội 7 ngày tới từ Open-Meteo (miễn phí, không cần API key)
// Cache 1 giờ trong RAM.

export interface WeatherDay {
  date: string; // YYYY-MM-DD
  tempMax: number; // °C
  tempMin: number; // °C
  precipitation: number; // mm
  weatherCode: number; // WMO code
  weatherDesc: string; // Mô tả bằng tiếng Việt
}

export interface WeatherResult {
  city: string;
  days: WeatherDay[];
  stale: boolean;
}

const CACHE_TTL_MS = 60 * 60_000; // 1 giờ
let cached: { result: WeatherResult; fetchedAt: number } | null = null;

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
const WEATHER_CODES: Record<number, string> = {
  0: 'Trời quang đãng',
  1: 'Quang đãng một phần',
  2: 'Nhiều mây',
  3: 'U ám',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày đặc',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa nặng hạt',
  71: 'Tuyết nhẹ',
  73: 'Tuyết vừa',
  75: 'Tuyết dày',
  77: 'Tuyết hạt',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào mạnh',
  85: 'Tuyết rào nhẹ',
  86: 'Tuyết rào mạnh',
  95: 'Giông bão',
  96: 'Giông bão có mưa đá nhẹ',
  99: 'Giông bão có mưa đá mạnh',
};

function getWeatherDesc(code: number): string {
  return WEATHER_CODES[code] || 'Không xác định';
}

export async function getHanoiWeather(now: Date = new Date()): Promise<WeatherResult> {
  // Check cache
  if (cached && now.getTime() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ...cached.result, stale: false };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);

  try {
    // Hà Nội coordinates
    const lat = 21.0285;
    const lon = 105.8542;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia/Bangkok&forecast_days=7`;

    const res = await fetch(url, { signal: ac.signal, cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`Open-Meteo API responded ${res.status}`);
    }

    const data = (await res.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_sum?: number[];
        weathercode?: number[];
      };
    };

    const daily = data.daily;
    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error('Invalid response from Open-Meteo');
    }

    const days: WeatherDay[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      const tempMax = daily.temperature_2m_max?.[i] ?? 0;
      const tempMin = daily.temperature_2m_min?.[i] ?? 0;
      const precipitation = daily.precipitation_sum?.[i] ?? 0;
      const weatherCode = daily.weathercode?.[i] ?? 0;

      days.push({
        date,
        tempMax: Math.round(tempMax * 10) / 10,
        tempMin: Math.round(tempMin * 10) / 10,
        precipitation: Math.round(precipitation * 10) / 10,
        weatherCode,
        weatherDesc: getWeatherDesc(weatherCode),
      });
    }

    const result: WeatherResult = {
      city: 'Hà Nội',
      days,
      stale: false,
    };

    cached = { result, fetchedAt: now.getTime() };
    return result;
  } catch (err) {
    console.warn('[weather] fetch failed:', (err as Error).message);

    // Fallback to cache if available
    if (cached) {
      return { ...cached.result, stale: true };
    }

    // Return empty result
    return {
      city: 'Hà Nội',
      days: [],
      stale: false,
    };
  } finally {
    clearTimeout(timer);
  }
}
