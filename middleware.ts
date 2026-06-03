// Middleware: chặn mọi route ngoài /login nếu chưa đăng nhập.
// Dùng Web Crypto qua lib/session để chạy được trên Edge runtime.
import { NextResponse, type NextRequest } from 'next/server';
import { isValidSessionValue, SESSION_COOKIE_NAME } from '@/lib/session';

const PUBLIC_PATHS = new Set(['/login', '/api/auth/login']);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (await isValidSessionValue(session)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
