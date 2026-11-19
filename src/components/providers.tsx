'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ApiError, del, get, onSignedOut, post } from '@/lib/client';

// ---- signed-in person ----------------------------------------------------------------------------------------------

export interface User { id: string; fullName: string; email: string; phone: string }
interface AuthCtx {
  /** undefined while we find out */
  user: User | null | undefined;
  logIn(identifier: string, password: string): Promise<User>;
  verifySignup(phone: string, code: string): Promise<User>;
  logOut(): Promise<void>;
  reload(): Promise<void>;
}
const Auth = createContext<AuthCtx | null>(null);
export const useAuth = () => { const c = useContext(Auth); if (!c) throw new Error('AuthProvider is missing'); return c; };

// ---- cart (kept in this browser) -------------------------------------------------------------------------------------

export interface CartLine { id: string; qty: number }
interface CartCtx { lines: CartLine[]; count: number; ready: boolean; add(id: string, qty?: number): void; setQty(id: string, qty: number): void; remove(id: string): void; clear(): void }
const Cart = createContext<CartCtx | null>(null);
export const useCart = () => { const c = useContext(Cart); if (!c) throw new Error('CartProvider is missing'); return c; };
const CART_KEY = 'shopcore.cart.v1';
export const MAX_QTY = 20;

// ---- wishlist --------------------------------------------------------------------------------------------------------

interface WishCtx { ids: Set<string>; has(id: string): boolean; toggle(id: string): Promise<void> }
const Wish = createContext<WishCtx | null>(null);
export const useWishlist = () => { const c = useContext(Wish); if (!c) throw new Error('WishlistProvider is missing'); return c; };

// ---- notices ---------------------------------------------------------------------------------------------------------

interface ToastCtx { toast(message: string, kind?: 'ok' | 'error'): void }
const Toast = createContext<ToastCtx>({ toast: () => undefined });
export const useToast = () => useContext(Toast);

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    setToastMsg({ text, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // who is signed in
  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/session', { cache: 'no-store' });
      setUser(r.ok ? ((await r.json()) as { user: User | null }).user : null);
    } catch { setUser(null); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => onSignedOut(() => { setUser(null); }), []);

  const logIn = useCallback(async (identifier: string, password: string) => {
    const r = await post<{ user: User }>('customer/auth/login', { identifier, password });
    setUser(r.user);
    return r.user;
  }, []);
  const verifySignup = useCallback(async (phone: string, code: string) => {
    const r = await post<{ user: User }>('customer/auth/verify-signup', { phone, code });
    setUser(r.user);
    return r.user;
  }, []);
  const logOut = useCallback(async () => {
    try { await post('customer/auth/logout'); } catch { /* signed out here either way */ }
    setUser(null);
    router.push('/');
    router.refresh();
  }, [router]);
  const auth = useMemo<AuthCtx>(() => ({ user, logIn, verifySignup, logOut, reload }), [user, logIn, verifySignup, logOut, reload]);

  // cart
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') as CartLine[];
      setLines(raw.filter((l) => typeof l.id === 'string' && Number.isInteger(l.qty) && l.qty > 0).slice(0, 60));
    } catch { /* an empty cart */ }
    setReady(true);
    const sync = (e: StorageEvent) => { if (e.key === CART_KEY) { try { setLines(JSON.parse(e.newValue ?? '[]') as CartLine[]); } catch { /* ignore */ } } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const save = useCallback((next: CartLine[]) => { setLines(next); try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch { /* private mode */ } }, []);
  const cart = useMemo<CartCtx>(() => ({
    lines, ready, count: lines.reduce((n, l) => n + l.qty, 0),
    add: (id, qty = 1) => save(lines.some((l) => l.id === id) ? lines.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) : [...lines, { id, qty: Math.min(MAX_QTY, qty) }]),
    setQty: (id, qty) => save(qty <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l))),
    remove: (id) => save(lines.filter((l) => l.id !== id)),
    clear: () => save([]),
  }), [lines, ready, save]);

  // wishlist (only for signed-in people)
  const [wish, setWish] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) { setWish(new Set()); return; }
    let live = true;
    get<{ items: { productId: string }[] }>('customer/wishlist').then((r) => { if (live) setWish(new Set(r.items.map((i) => i.productId))); }, () => undefined);
    return () => { live = false; };
  }, [user]);
  const wishlist = useMemo<WishCtx>(() => ({
    ids: wish,
    has: (id) => wish.has(id),
    toggle: async (id) => {
      if (!user) { router.push(`/login?next=${encodeURIComponent(path || '/')}`); return; }
      const had = wish.has(id);
      setWish((s) => { const n = new Set(s); if (had) n.delete(id); else n.add(id); return n; });
      try { if (had) await del(`customer/wishlist/${id}`); else await post('customer/wishlist', { productId: id }); }
      catch (e) {
        setWish((s) => { const n = new Set(s); if (had) n.add(id); else n.delete(id); return n; });
        toast(e instanceof ApiError ? e.message : 'Couldn’t update your wishlist', 'error');
      }
    },
  }), [wish, user, router, path, toast]);

  return (
    <Auth.Provider value={auth}>
      <Cart.Provider value={cart}>
        <Wish.Provider value={wishlist}>
          <Toast.Provider value={{ toast }}>
            {children}
            <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
              {toastMsg && (
                <div role={toastMsg.kind === 'error' ? 'alert' : 'status'} className={`pointer-events-auto rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${toastMsg.kind === 'error' ? 'bg-danger' : 'bg-ink'}`}>
                  {toastMsg.text}
                </div>
              )}
            </div>
          </Toast.Provider>
        </Wish.Provider>
      </Cart.Provider>
    </Auth.Provider>
  );
}
