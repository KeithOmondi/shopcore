import Link from 'next/link';

import { Icon } from './icons';

export function Footer({ categories, pages = [] }: { categories: { handle: string; name: string }[]; pages?: { title: string; slug: string }[] }) {
  const extra = pages.filter((p) => !['/terms', '/privacy'].includes(p.slug)).slice(0, 6);
  return (
    <footer className="mt-12 bg-ink text-white/80">
      <div className="border-b border-white/10">
        <ul className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Our promise">
          {[['delivery', 'Delivery to your door', 'See the fee before you pay'], ['mpesa', 'M-Pesa or cash', 'Pay online, or when it arrives'], ['returns', 'Easy returns', 'Ask from your orders page'], ['shield', 'Safe shopping', 'Your details stay private']].map(([icon, t, s]) => (
            <li key={t} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white"><Icon name={icon!} size={22} /></span>
              <span><b className="block text-sm text-white">{t}</b><span className="text-xs">{s}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-white">shop<span className="text-brand-soft">core</span></p>
          <p className="mt-3 max-w-xs text-sm">Shop online and get it delivered. Pay with M-Pesa, or in cash when it arrives.</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.slice(0, 6).map((c) => <li key={c.handle}><Link className="hover:text-white hover:underline" href={`/c/${c.handle}`}>{c.name}</Link></li>)}
            <li><Link className="hover:text-white hover:underline" href="/categories">All categories</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/deals">Deals</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/offers">Offers and rewards</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/help">Help centre</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/account/orders">Track my order</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/account/support">Contact support</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/help">Returns and refunds</Link></li>
            {extra.map((p) => <li key={p.slug}><Link className="hover:text-white hover:underline" href={`/info/${p.slug.replace(/^[/]+/, '')}`}>{p.title}</Link></li>)}
            <li><Link className="hover:text-white hover:underline" href="/terms">Terms of service</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/privacy">Privacy policy</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">My account</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white hover:underline" href="/login">Log in</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/signup">Create an account</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/account/wishlist">Saved items</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/cart">Cart</Link></li>
          </ul>
          <p className="mt-5 flex items-center gap-2 text-xs"><Icon name="mpesa" size={18} /> We accept M-Pesa and cash on delivery</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 pb-20 text-center text-xs md:pb-4">© {new Date().getFullYear()} ShopCore. All rights reserved.</div>
    </footer>
  );
}
