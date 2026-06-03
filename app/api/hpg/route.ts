import { NextResponse } from 'next/server';
import { getHpgQuote } from '@/lib/integrations/hpg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getHpgQuote();
  return NextResponse.json(result);
}
