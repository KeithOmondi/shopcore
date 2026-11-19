import Link from 'next/link';

import { BannerCarousel } from '@/components/BannerCarousel';
import { CategoryFlyout } from '@/components/CategoryFlyout';
import { Icon } from '@/components/icons';
import { ProductRow } from '@/components/ProductCard';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { Countdown } from '@/components/Rows';
import { cards, getCatalogue, getHome } from '@/lib/catalogue';
import { CATEGORY_ICON } from '@/lib/category-icons';
import { bannerHref } from '@/lib/links';
import type { Product } from '@/lib/types';

export const revalidate = 60;

const PERKS: [string, string, string, string][] = [
  ['mpesa', 'Pay with M-Pesa', 'Or cash when it arrives', '/help'],
  ['delivery', 'Delivery to your door', 'See the fee before you pay', '/help'],
  ['returns', 'Easy returns', 'Ask from your orders page', '/help'],
  ['help', 'Need help?', 'Visit the help centre', '/help'],
];

function SectionHead({ id, title, sub, href, tone = 'plain' }: { id: string; title: string; sub?: string; href: string; tone?: 'plain' | 'hot' }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${tone === 'hot' ? 'rounded-t-2xl bg-brand px-4 py-3 text-white' : 'mb-3'}`}>
      <div>
        <h2 id={id} className={`text-xl font-extrabold ${tone === 'hot' ? '!text-white' : ''}`}>{title}</h2>
        {sub && <p className={`text-sm ${tone === 'hot' ? 'text-white/85' : 'text-muted'}`}>{sub}</p>}
      </div>
      <Link href={href} className={`shrink-0 text-sm font-bold hover:underline ${tone === 'hot' ? 'text-white' : 'text-brand'}`}>See all</Link>
    </div>
  );
}

export default async function HomePage() {
  const [cat, home] = await Promise.all([getCatalogue(), getHome()]);
  const all = cards(cat.products);
  const nav = cat.categories.map((c) => ({ handle: c.handle, name: c.name, subs: c.subcategories }));

  const banners = home.banners.map((b) => ({ id: b.id, title: b.title, label: b.label, href: bannerHref(b.link), alt: b.alt, image: b.imageRef ? (/^https?:|^\//.test(b.imageRef) ? b.imageRef : `/v1/files/${b.imageRef}`) : null }));

  // The shop decides which sections the home page shows. With none saved, every section shows.
  const picks: { key: string; title: string; sub: string; href: string; items: Product[] }[] = [];
  const defs: { key: string; re: RegExp; title: string; sub: string; href: string; items: () => Product[] }[] = [
    { key: 'flash', re: /flash|sale|deal/i, title: 'Flash sale', sub: 'Limited-time prices', href: '/deals', items: () => [...all.filter((p) => p.onSale)].sort((a, b) => (b.listPriceCents - b.priceCents) / b.listPriceCents - (a.listPriceCents - a.priceCents) / a.listPriceCents) },
    { key: 'new', re: /new/i, title: 'New arrivals', sub: 'Fresh in the shop', href: '/shop?sort=new', items: () => all.filter((p) => p.isNew) },
    { key: 'featured', re: /featur|for you|pick/i, title: 'Featured products', sub: 'Picked for you', href: '/shop', items: () => all.filter((p) => !p.onSale) },
    { key: 'top', re: /top|rated|best/i, title: 'Top rated', sub: 'What others love', href: '/shop?sort=rating', items: () => [...all].filter((p) => (p.rating ?? 0) > 0).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews) },
  ];
  for (const d of defs) {
    const sec = home.sections.find((s) => d.re.test(s.name));
    if (home.sections.length && !sec) continue;
    const items = d.items().slice(0, Math.min(14, Math.max(6, sec?.count ?? 10)));
    if (items.length >= (d.key === "flash" ? 1 : 4)) picks.push({ key: d.key, title: sec?.name ?? d.title, sub: sec?.sub || d.sub, href: d.href, items });
  }

  // When the earliest sale ends, the flash-sale clock runs down to it.
  const ends = [...new Set(all.filter((p) => p.onSale && p.saleEndsAt).map((p) => p.saleEndsAt!))].sort().slice(0, 20);

  // One row per category that has enough in stock to be worth browsing.
  const showcases = cat.categories
    .map((c) => ({ c, items: all.filter((p) => p.categoryId === c.id && p.inStock).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews).slice(0, 12) }))
    .filter((s) => s.items.length >= 4).slice(0, 6);

  const brandCount = new Map<string, number>();
  for (const p of all) if (p.brand) brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1);
  const brands = [...brandCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 16).map(([n]) => n);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 lg:grid-cols-[15.5rem_minmax(0,1fr)_15rem]">
        <aside className="hidden self-start rounded-2xl border border-line bg-white py-2 lg:block" aria-label="Categories">
          <CategoryFlyout categories={nav} />
          <Link href="/categories" className="block border-t border-line px-4 pb-1 pt-3 text-sm font-bold text-brand hover:underline">All categories</Link>
        </aside>

        <div className="min-w-0">
          {banners.length ? <BannerCarousel banners={banners} /> : (
            <section className="grid min-h-60 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-center text-white sm:min-h-80">
              <div>
                <h1 className="text-3xl font-extrabold !text-white sm:text-4xl">Everything you need, delivered.</h1>
                <p className="mx-auto mt-2 max-w-md text-white/90">Electronics, fashion, home and groceries. Pay with M-Pesa or when it arrives.</p>
                <Link href="/shop" className="btn mt-5 bg-white text-brand hover:bg-brand-tint">Start shopping</Link>
              </div>
            </section>
          )}
        </div>

        <ul className="hidden gap-3 lg:grid" aria-label="Why shop with us">
          {PERKS.map(([icon, title, text, href]) => (
            <li key={title}>
              <Link href={href} className="card flex h-full items-center gap-3 p-3 transition-shadow hover:shadow-lg">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"><Icon name={icon} size={20} /></span>
                <span><b className="block text-sm text-ink">{title}</b><span className="text-xs text-muted">{text}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {cat.categories.length > 0 && (
        <section aria-labelledby="cats" className="lg:hidden">
          <h2 id="cats" className="sr-only">Shop by category</h2>
          <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cat.categories.map((c) => (
              <li key={c.id} className="w-[4.5rem] shrink-0">
                <Link href={`/c/${c.handle}`} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-tint text-brand ring-1 ring-brand-soft"><Icon name={CATEGORY_ICON[c.handle] ?? 'categories'} size={26} /></span>
                  <span className="line-clamp-2 text-xs font-semibold leading-4 text-ink">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {picks.map((s) => (
        <section key={s.key} aria-labelledby={`s-${s.key}`} className={s.key === 'flash' ? 'overflow-hidden rounded-2xl bg-white ring-1 ring-line' : ''}>
          {s.key === 'flash' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-brand px-4 py-3 text-white">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                  <h2 id={`s-${s.key}`} className="text-xl font-extrabold !text-white">⚡ {s.title}</h2>
                  {ends.length > 0 && <Countdown endsAt={ends} />}
                </div>
                <Link href={s.href} className="text-sm font-bold text-white hover:underline">See all</Link>
              </div>
              <div className="p-3"><ProductRow items={s.items} label={s.title} /></div>
            </>
          ) : (
            <>
              <SectionHead id={`s-${s.key}`} title={s.title} sub={s.sub} href={s.href} />
              <ProductRow items={s.items} label={s.title} />
            </>
          )}
        </section>
      ))}

      {cat.categories.length > 0 && (
        <section aria-labelledby="cats-all" className="hidden lg:block">
          <h2 id="cats-all" className="mb-3 text-xl font-extrabold">Shop by category</h2>
          <ul className="grid grid-cols-5 gap-3">
            {cat.categories.map((c) => (
              <li key={c.id}>
                <Link href={`/c/${c.handle}`} className="card flex h-full items-center gap-3 p-4 transition-shadow hover:shadow-lg">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"><Icon name={CATEGORY_ICON[c.handle] ?? 'categories'} size={22} /></span>
                  <span className="text-sm font-bold text-ink">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showcases.map(({ c, items }) => (
        <section key={c.id} aria-labelledby={`c-${c.handle}`}>
          <SectionHead id={`c-${c.handle}`} title={c.name} sub={c.description || undefined} href={`/c/${c.handle}`} />
          <ProductRow items={items} label={c.name} />
        </section>
      ))}

      {brands.length > 0 && (
        <section aria-labelledby="brands">
          <h2 id="brands" className="mb-3 text-xl font-extrabold">Top brands</h2>
          <ul className="flex flex-wrap gap-2">
            {brands.map((b) => <li key={b}><Link href={`/shop?brand=${encodeURIComponent(b)}`} className="block rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand">{b}</Link></li>)}
          </ul>
        </section>
      )}

      <RecentlyViewed />

      {!picks.length && (
        <div className="card p-10 text-center">
          <h2 className="text-lg font-bold">The shop is getting ready</h2>
          <p className="mt-1 text-sm text-muted">Products will appear here soon.</p>
        </div>
      )}

      <section className="grid gap-4 rounded-2xl bg-white p-6 ring-1 ring-line sm:grid-cols-2 lg:hidden" aria-label="Why shop with us">
        {PERKS.slice(0, 3).map(([icon, title, text]) => (
          <div key={title} className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"><Icon name={icon} size={22} /></span>
            <div><h3 className="font-bold text-ink">{title}</h3><p className="text-sm text-muted">{text}</p></div>
          </div>
        ))}
      </section>
    </div>
  );
}
