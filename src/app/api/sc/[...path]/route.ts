import { NextRequest, NextResponse } from 'next/server';

import { API_URL } from '@/lib/server-api';
import { ACCESS, REFRESH, clearTokens, errorJson, sameOrigin, setTokens, type Tokens } from '@/lib/session';

/** Only what the shop itself needs. Anything else (the admin, staff, riders) is not reachable through here. */
const ALLOWED = [
  /^storefront\//, /^delivery\//, /^help\//, /^app\//,
  /^customer\//, /^coupons\/quote$/, /^support\//,
  /^orders(\/|$)/, /^products\/[0-9a-f-]{36}\/availability$/,
];
const NEVER = [/^customer\/auth\/refresh$/, /^customer\/push-token$/];

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rest = path.join('/');
  if (!ALLOWED.some((r) => r.test(rest)) || NEVER.some((r) => r.test(rest))) return errorJson(404, 'NOT_FOUND', 'Not found');
  if (!sameOrigin(req)) return errorJson(403, 'FORBIDDEN', 'Request refused');

  const at = req.cookies.get(ACCESS)?.value;
  const rt = req.cookies.get(REFRESH)?.value;
  const target = `${API_URL}/v1/${rest}${req.nextUrl.search}`;

  const headers: Record<string, string> = { accept: req.headers.get('accept') ?? 'application/json' };
  const ct = req.headers.get('content-type');
  if (ct) headers['content-type'] = ct;
  const idem = req.headers.get('idempotency-key');
  if (idem) headers['idempotency-key'] = idem;
  // The API rate-limits by address, so it has to see the visitor's, not this website's.
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
  if (ip) headers['x-forwarded-for'] = ip;
  if (at) headers.authorization = `Bearer ${at}`;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.text() : undefined;
  let up: Response;
  try {
    up = await fetch(target, { method: req.method, headers, body: body || undefined, cache: 'no-store', redirect: 'manual' });
  } catch {
    return errorJson(502, 'UNREACHABLE', 'We can’t reach ShopCore right now. Please try again.');
  }

  // Signing in or out changes the cookies.
  if (rest === 'customer/auth/login' || rest === 'customer/auth/verify-signup') {
    if (!up.ok) return passThrough(up);
    const t = (await up.json()) as Tokens;
    const res = NextResponse.json({ user: t.user });
    setTokens(res, t);
    return res;
  }
  if (rest === 'customer/auth/logout') {
    const res = new NextResponse(null, { status: 204 });
    clearTokens(res);
    return res;
  }

  if (up.status === 401 && !rest.startsWith('customer/auth/')) {
    // The page asks /api/session/refresh once and then tries again.
    return errorJson(401, rt ? 'TOKEN_EXPIRED' : 'SIGNED_OUT', rt ? 'Refreshing your session' : 'Please log in');
  }
  return passThrough(up);
}

async function passThrough(up: Response) {
  const out = new Headers();
  for (const h of ['content-type', 'content-disposition', 'cache-control', 'retry-after']) { const v = up.headers.get(h); if (v) out.set(h, v); }
  out.set('cache-control', 'private, no-store');
  return new NextResponse(up.status === 204 ? null : await up.arrayBuffer(), { status: up.status, headers: out });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
