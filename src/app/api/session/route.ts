import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/lib/server-api';
import { ACCESS, REFRESH, clearTokens, refreshWith, setTokens, type ApiUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Who is signed in? Used when a page opens. Quietly renews the session if the short-lived token has run out. */
export async function GET(req: NextRequest) {
  const at = req.cookies.get(ACCESS)?.value;
  const rt = req.cookies.get(REFRESH)?.value;
  const none = () => NextResponse.json({ user: null }, { headers: { 'cache-control': 'private, no-store' } });
  if (!at && !rt) return none();

  if (at) {
    const me = await fetch(`${API_URL}/v1/customer/me`, { headers: { authorization: `Bearer ${at}`, accept: 'application/json' }, cache: 'no-store' }).catch(() => null);
    if (me?.ok) {
      const p = (await me.json()) as { id: string; fullName: string; email: string; phone: string };
      const user: ApiUser = { id: p.id, fullName: p.fullName, email: p.email, phone: p.phone };
      return NextResponse.json({ user }, { headers: { 'cache-control': 'private, no-store' } });
    }
    if (me && me.status !== 401) return none();
  }
  if (!rt) { const res = none(); clearTokens(res); return res; }
  const t = await refreshWith(rt);
  if (!t) { const res = none(); clearTokens(res); return res; }
  const res = NextResponse.json({ user: t.user }, { headers: { 'cache-control': 'private, no-store' } });
  setTokens(res, t);
  return res;
}
