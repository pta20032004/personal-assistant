import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionCookieValue,
} from '@/lib/session';

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword) {
    return NextResponse.json(
      { error: 'OWNER_PASSWORD chưa được cấu hình' },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (parsed.data.password !== ownerPassword) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }
  const value = await createSessionCookieValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
