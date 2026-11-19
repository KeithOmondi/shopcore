'use client';

/** The browser's one way of talking to ShopCore. Everything goes through this website (/api/sc/...), which adds the sign-in. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string, readonly field?: string) { super(message); }
}

let refreshing: Promise<boolean> | null = null;
/** One refresh at a time, however many requests ran out of time together. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/session/refresh', { method: 'POST' }).then((r) => r.ok, () => false).finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  return refreshing;
}

type Listener = () => void;
const signedOutListeners = new Set<Listener>();
export const onSignedOut = (fn: Listener) => { signedOutListeners.add(fn); return () => { signedOutListeners.delete(fn); }; };

async function failure(res: Response): Promise<ApiError> {
  let message = `Something went wrong (${res.status}). Please try again.`;
  let code: string | undefined;
  let field: string | undefined;
  try {
    const j = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown } };
    if (j.error) {
      code = j.error.code;
      message = j.error.message ?? message;
      const d = j.error.details;
      if (Array.isArray(d) && d[0] && typeof d[0] === 'object') {
        const first = d[0] as { path?: unknown[] };
        const last = first.path?.[first.path.length - 1];
        if (typeof last === 'string') field = last;
      }
    }
  } catch { /* keep the default message */ }
  if (res.status === 429) message = 'Too many attempts. Wait a moment and try again.';
  return new ApiError(message, res.status, code, field);
}

export async function api<T = unknown>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const url = `/api/sc/${path.replace(/^\/?(v1\/)?/, '')}`;
  const go = () => fetch(url, { method, headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
  let res: Response;
  try { res = await go(); } catch { throw new ApiError('Can’t reach ShopCore. Check your connection and try again.', 0, 'NETWORK'); }
  if (res.status === 401) {
    const code = (await res.clone().json().catch(() => null) as { error?: { code?: string } } | null)?.error?.code;
    if (code === 'TOKEN_EXPIRED' && (await refreshSession())) {
      try { res = await go(); } catch { throw new ApiError('Can’t reach ShopCore. Check your connection and try again.', 0, 'NETWORK'); }
    }
    if (res.status === 401 && code !== 'INVALID_CREDENTIALS') {
      const c2 = (await res.clone().json().catch(() => null) as { error?: { code?: string } } | null)?.error?.code;
      if (c2 === 'SIGNED_OUT' || c2 === 'TOKEN_EXPIRED') { signedOutListeners.forEach((f) => f()); throw new ApiError('Your session has ended. Please log in again.', 401, 'SIGNED_OUT'); }
    }
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw await failure(res);
  return (await res.json()) as T;
}
export const get = <T,>(path: string) => api<T>('GET', path);
export const post = <T,>(path: string, body?: unknown, headers?: Record<string, string>) => api<T>('POST', path, body ?? {}, headers);
export const patch = <T,>(path: string, body: unknown) => api<T>('PATCH', path, body);
export const del = <T = void,>(path: string) => api<T>('DELETE', path);
