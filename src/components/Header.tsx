'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { CategoryFlyout, type NavCategory } from './CategoryFlyout';
import { Icon } from './icons';
import { useAuth, useCart } from './providers';

export type { NavCategory };

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const path = usePathname();
  const [q, setQ] = useState(path === '/search' ? (params.get('q') ?? '') : '');
  return (
    <form role="search" className="flex w-full overflow-hidden rounded-full border-2 border-brand bg-white focus-within:ring-4 focus-within:ring-brand-soft" onSubmit={(e) => { e.preventDefault(); const t = q.trim(); if (t) router.push(`/search?q=${encodeURIComponent(t)}`); }}>
      <label htmlFor="site-search" className="sr-only">Search products, brands and categories</label>
      <Icon name="search" size={20} className="pointer-events-none my-auto ml-4 shrink-0 text-muted" />
      <input id="site-search" className="min-h-11 w-full min-w-0 bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted" type="search" placeholder="Search products, brands and categories" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" autoComplete="off" />
      <button type="submit" className="bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark sm:px-7">Search</button>
    </form>
  );
}

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open, close]);
  return ref;
}

function AccountMenu() {
  const { user, logOut } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  useEffect(() => setOpen(false), [path]);
  const items: [string, string, string][] = [['/account', 'My account', 'profile'], ['/account/orders', 'Orders', 'order'], ['/account/wishlist', 'Saved items', 'heart'], ['/account/addresses', 'Addresses', 'home']];
  if (user === undefined) return <span className="h-10 w-24" />;
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-soft" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="profile" size={22} />
        <span className="hidden lg:inline">{user ? `Hi, ${user.fullName.split(' ')[0]}` : 'Account'}</span>
        <Icon name="down" size={14} className="hidden lg:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-xl">
          {user ? (
            <>
              {items.map(([href, label, icon]) => <Link key={href} role="menuitem" href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-soft"><Icon name={icon} size={18} className="text-muted" />{label}</Link>)}
              <button role="menuitem" className="mt-1 block w-full rounded-xl border-t border-line px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-soft" onClick={() => { setOpen(false); void logOut(); }}>Log out</button>
            </>
          ) : (
            <div className="p-2">
              <Link href={`/login?next=${encodeURIComponent(path || '/')}`} className="btn btn-primary w-full">Log in</Link>
              <p className="mt-3 text-center text-sm text-muted">New here? <Link href="/signup" className="font-bold text-brand hover:underline">Create an account</Link></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AllCategories({ categories }: { categories: NavCategory[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-2 rounded-full bg-brand-tint px-4 py-2 text-sm font-bold text-brand hover:bg-brand-soft" aria-expanded={open} aria-controls="all-categories" onClick={() => setOpen((v) => !v)}>
        <Icon name="menu" size={18} /> All categories
      </button>
      {open && <div id="all-categories" className="absolute left-0 top-full z-50 w-64 pt-2"><CategoryFlyout categories={categories} className="rounded-xl border border-line bg-white py-2 shadow-xl" /></div>}
    </div>
  );
}

export function Header({ categories }: { categories: NavCategory[] }) {
  const { count } = useCart();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="hidden bg-ink text-xs text-white/90 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <p className="flex items-center gap-2"><Icon name="mpesa" size={14} /> Pay with M-Pesa or cash on delivery · Delivery across Kenya</p>
          <nav aria-label="Quick links" className="flex gap-5 font-semibold">
            <Link href="/account/orders" className="hover:text-white">Track my order</Link>
            <Link href="/help" className="hover:text-white">Help centre</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 md:gap-5">
        <button className="rounded-full p-2 hover:bg-soft md:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}><Icon name={open ? 'close' : 'menu'} /></button>
        <Link href="/" className="shrink-0 text-2xl font-extrabold tracking-tight text-ink" aria-label="ShopCore home">shop<span className="text-brand">core</span></Link>
        <div className="hidden flex-1 md:block"><Suspense fallback={<div className="input" />}><SearchBox /></Suspense></div>
        <nav className="ml-auto flex items-center gap-1" aria-label="Account and cart">
          <AccountMenu />
          <Link href="/help" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-soft lg:flex"><Icon name="help" size={22} /> Help</Link>
          <Link href="/cart" className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-soft" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <Icon name="cart" size={24} />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && <span className="absolute -top-0.5 left-6 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-5 text-white sm:left-5">{count > 99 ? '99+' : count}</span>}
          </Link>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden"><Suspense fallback={<div className="input" />}><SearchBox /></Suspense></div>

      <nav aria-label="Shop" className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5 text-sm font-semibold text-ink">
          <AllCategories categories={categories} />
          <ul className="flex min-w-0 flex-1 gap-0.5 overflow-hidden">
            {categories.slice(0, 6).map((c) => <li key={c.handle}><Link href={`/c/${c.handle}`} className={`block whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-soft ${path === `/c/${c.handle}` ? 'text-brand' : ''}`}>{c.name}</Link></li>)}
          </ul>
          <Link href="/deals" className="whitespace-nowrap rounded-full px-3 py-1.5 font-bold text-danger hover:bg-soft">🔥 Deals</Link>
        </div>
      </nav>

      {open && (
        <nav aria-label="Menu" className="border-t border-line bg-white md:hidden">
          <ul className="max-h-[70vh] overflow-y-auto px-4 py-2 text-base font-semibold text-ink">
            <li><Link href="/deals" className="block rounded-xl px-3 py-3 font-bold text-danger hover:bg-soft">Deals</Link></li>
            <li><Link href="/shop" className="block rounded-xl px-3 py-3 hover:bg-soft">All products</Link></li>
            {categories.map((c) => <li key={c.handle}><Link href={`/c/${c.handle}`} className="block rounded-xl px-3 py-3 hover:bg-soft">{c.name}</Link></li>)}
            <li><Link href="/help" className="block rounded-xl px-3 py-3 hover:bg-soft">Help centre</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

/** The bar at the foot of a phone screen. */
export function MobileNav() {
  const path = usePathname();
  const { count } = useCart();
  if (path.startsWith('/checkout') || path.startsWith('/p/')) return null;
  const tabs: [string, string, string][] = [['/', 'Home', 'home'], ['/categories', 'Categories', 'categories'], ['/cart', 'Cart', 'cart'], ['/account', 'Account', 'profile']];
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4">
        {tabs.map(([href, label, icon]) => {
          const on = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? 'page' : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on ? 'text-brand' : 'text-muted'}`}>
                <Icon name={icon} size={24} />{label}
                {href === '/cart' && count > 0 && <span className="absolute left-1/2 top-1 ml-2 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">{count > 99 ? '99+' : count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
