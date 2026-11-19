import 'server-only';

// Where the ShopCore API lives. Set SHOPCORE_API_URL; in production it falls back to the live API, never to localhost.
const DEFAULT_API = process.env.NODE_ENV === 'production' ? 'https://shopcoreserver.onrender.com' : 'http://localhost:8080';
export const API_URL = (process.env.SHOPCORE_API_URL || DEFAULT_API).replace(/\/$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** A public (no sign-in) GET against the ShopCore API, kept for `revalidate` seconds (in Next's cache, and at Cloudflare's edge). */
export async function publicGet<T>(path: string, revalidate = 60): Promise<T> {
  const init = { headers: { accept: 'application/json' }, next: { revalidate }, cf: { cacheTtl: revalidate, cacheEverything: true } } as RequestInit;
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`ShopCore API ${path} answered ${res.status}`);
  return (await res.json()) as T;
}
