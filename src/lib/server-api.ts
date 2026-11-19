import 'server-only';

export const API_URL = (process.env.SHOPCORE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** A public (no sign-in) GET against the ShopCore API, kept for `revalidate` seconds. */
export async function publicGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: { accept: 'application/json' }, next: { revalidate } });
  if (!res.ok) throw new Error(`ShopCore API ${path} answered ${res.status}`);
  return (await res.json()) as T;
}
