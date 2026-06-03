// Session đơn giản cho ứng dụng cá nhân: cookie ký HMAC-SHA256 bằng Web Crypto
// (chạy được cả Node runtime và Edge middleware). Không JWT, không iron-session.
//
// Cookie value = "<issuedAtMs>.<base64url-hmac>"
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'pa_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

function getSecretBytes(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET phải có ít nhất 16 ký tự (xem .env.example)');
  }
  return new TextEncoder().encode(secret);
}

let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      'raw',
      getSecretBytes(),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return keyPromise;
}

function bytesToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  // btoa works in both Node (>=16) and Edge.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(sig);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionCookieValue(): Promise<string> {
  const issuedAt = String(Date.now());
  const sig = await sign(issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function isValidSessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf('.');
  if (dot <= 0) return false;
  const issuedAt = value.slice(0, dot);
  const provided = value.slice(dot + 1);
  if (!/^\d+$/.test(issuedAt)) return false;
  const expected = await sign(issuedAt);
  return constantTimeEqual(provided, expected);
}

/** Server-side check used by Server Components. */
export async function isAuthenticated(): Promise<boolean> {
  return isValidSessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
}
