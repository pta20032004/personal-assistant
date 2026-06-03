import { NextResponse } from 'next/server';
import { getHanoiWeather } from '@/lib/integrations/weather';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getHanoiWeather();
  return NextResponse.json(result);
}
