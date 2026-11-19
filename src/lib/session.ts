import 'server-only';

import { NextResponse } from 'next/server';

import { API_URL } from './server-api';

/**
 * Signing in. The tokens the ShopCore API hands out are kept in httpOnly cookies, so scripts on the page can never read them.
 * The browser only ever talks to this website (/api/sc/...), which adds the token and passes the request on.
 */
export const ACCESS = 'sc_at';
export const REFRESH = 'sc_rt';
const REFRESH_DAYS = 30;

export interface ApiUser { id: string; fullName: string; email: string; phone: string }
export interface Tokens { accessToken: string; refreshToken: string; expiresIn: number; user: ApiUser }

const secure = process.env.NODE_ENV === 'production';
const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

export function setTokens(res: NextResponse, t: Tokens) {
  res.cookies.set(ACCESS, t.accessToken, { ...base, maxAge: Math.max(60, t.expiresIn - 30) });
  res.cookies.set(REFRESH, t.refreshToken, { ...base, maxAge: REFRESH_DAYS * 86400 });
}
export function clearTokens(res: NextResponse) {
  res.cookies.set(ACCESS, '', { ...base, maxAge: 0 });
  res.cookies.set(REFRESH, '', { ...base, maxAge: 0 });
}

// A refresh token may only be used once (the API treats a second use as theft), so requests that arrive together share one refresh.
const inflight = new Map<string, Promise<Tokens | null>>();
export function refreshWith(token: string): Promise<Tokens | null> {
  let p = inflight.get(token);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`${API_URL}/v1/customer/auth/refresh`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ refreshToken: token }) });
        return res.ok ? ((await res.json()) as Tokens) : null;
      } catch { return null; }
    })();
    inflight.set(token, p);
    setTimeout(() => inflight.delete(token), 10_000);
  }
  return p;
}

export const errorJson = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status });

/** A write must come from this website itself (the cookies are SameSite=Lax as well). */
export function sameOrigin(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === (req.headers.get('x-forwarded-host') ?? req.headers.get('host')); } catch { return false; }
}
