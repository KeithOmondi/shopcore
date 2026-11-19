import { NextRequest, NextResponse } from 'next/server';

import { REFRESH, clearTokens, errorJson, refreshWith, sameOrigin, setTokens } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Called by the page when the API says the short-lived token has run out. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return errorJson(403, 'FORBIDDEN', 'Request refused');
  const rt = req.cookies.get(REFRESH)?.value;
  if (!rt) return errorJson(401, 'SIGNED_OUT', 'Please log in');
  const t = await refreshWith(rt);
  if (!t) { const res = errorJson(401, 'SIGNED_OUT', 'Your session has ended. Please log in again.'); clearTokens(res); return res; }
  const res = NextResponse.json({ user: t.user });
  setTokens(res, t);
  return res;
}
