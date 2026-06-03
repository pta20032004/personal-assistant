import { NextResponse } from 'next/server';
import { getRecentNews } from '@/lib/integrations/news';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('q') || undefined;
  
  const result = await getRecentNews(new Date(), keyword);
  return NextResponse.json(result);
}
