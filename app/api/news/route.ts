import { NextResponse } from 'next/server';
import { getRecentNews } from '@/lib/integrations/news';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getRecentNews();
  return NextResponse.json(result);
}
