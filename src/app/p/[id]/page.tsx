import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BuyBox, type OptionDef } from '@/components/BuyBox';
import { Icon } from '@/components/icons';
import { Price, ProductRow, Stars } from '@/components/ProductCard';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { ProductGallery } from '@/components/ProductGallery';
import { cards, getCatalogue, getReviews } from '@/lib/catalogue';
import { dateOnly } from '@/lib/format';
import { SITE_URL } from '@/lib/server-api';
import type { Attribute, Product } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

async function find(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const cat = await getCatalogue();
  const p = cat.products.find((x) => x.id === id);
  return p ? { cat, p } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const f = await find(id).catch(() => null);
  if (!f) return { title: 'Product not found' };
  const { p } = f;
  const title = p.brand && !p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? `${p.brand} ${p.name}` : p.name;
  const description = (p.description || `Buy ${p.name} at ShopCore.`).slice(0, 160);
  const image = p.images[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${SITE_URL}${p.images[0]}`) : undefined;
  return { title, description, alternates: { canonical: `/p/${p.id}` }, openGraph: { title, description, type: 'website', images: image ? [{ url: image }] : undefined } };
}

const fmtSpec = (a: Attribute, v: string | number | boolean) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : a.unit && typeof v === 'number' ? `${v} ${a.unit}` : String(v));

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const f = await find(id);
  if (!f) notFound();
  const { cat, p } = f;
  const category = cat.categories.find((c) => c.id === p.categoryId);
  const reviews = await getReviews(p.id);

  const mates = p.groupId ? cat.products.filter((x) => x.groupId === p.groupId) : [p];
  const optionAttrs = (category?.attributes ?? []).filter((a) => a.isOption && mates.some((m) => m.options[a.key]));
  const options: OptionDef[] = optionAttrs.map((a) => {
    const seen = [...new Set(mates.map((m) => m.options[a.key]).filter((v): v is string => !!v))];
    const order = a.choices.length ? a.choices : seen;
    return { key: a.key, label: a.label, values: seen.sort((x, y) => (order.indexOf(x) === -1 ? 999 : order.indexOf(x)) - (order.indexOf(y) === -1 ? 999 : order.indexOf(y)) || x.localeCompare(y, undefined, { numeric: true })) };
  });
  const specs = (category?.attributes ?? []).filter((a) => !a.isOption && p.specs[a.key] !== undefined && p.specs[a.key] !== '').map((a) => ({ label: a.label, value: fmtSpec(a, p.specs[a.key]!) }));
  const picked = optionAttrs.map((a) => p.options[a.key]).filter(Boolean).join(' / ');

  const related: Product[] = cards(cat.products.filter((x) => x.categoryId === p.categoryId && x.subcategory === p.subcategory && x.groupId !== p.groupId && x.id !== p.id)).slice(0, 12);
  const sameBrand: Product[] = p.brand ? cards(cat.products.filter((x) => x.brand === p.brand && x.groupId !== p.groupId && x.id !== p.id && !related.some((r) => r.id === x.id))).slice(0, 12) : [];
  const off = p.onSale && p.listPriceCents > p.priceCents ? Math.round((1 - p.priceCents / p.listPriceCents) * 100) : 0;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description || undefined, sku: p.id,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    image: p.images.map((i) => (i.startsWith('http') ? i : `${SITE_URL}${i}`)),
    offers: { '@type': 'Offer', priceCurrency: p.currency, price: (p.priceCents / 100).toFixed(2), availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `${SITE_URL}/p/${p.id}` },
    aggregateRating: reviews.count > 0 ? { '@type': 'AggregateRating', ratingValue: reviews.average, reviewCount: reviews.count } : undefined,
  };

  return (
    <div className="space-y-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-brand">Home</Link></li>
          {category && <><li aria-hidden><Icon name="chevron" size={14} /></li><li><Link href={`/c/${category.handle}`} className="hover:text-brand">{category.name}</Link></li></>}
          {p.subcategory && category && <><li aria-hidden><Icon name="chevron" size={14} /></li><li><Link href={`/c/${category.handle}?sub=${encodeURIComponent(p.subcategory)}`} className="hover:text-brand">{p.subcategory}</Link></li></>}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery key={p.id} images={p.images} name={p.name} />
        <div className="space-y-5">
          <div>
            {p.brand && <p className="text-sm font-bold uppercase tracking-wide text-brand">{p.brand}</p>}
            <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{p.name}</h1>
            {picked && <p className="mt-1 text-sm text-muted">{picked}</p>}
            <div className="mt-2"><Stars value={reviews.count ? reviews.average : null} count={reviews.count} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Price cents={p.priceCents} listCents={p.listPriceCents} large />
            {off > 0 && <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">Save {off}%</span>}
          </div>
          <BuyBox id={p.id} name={p.name} inStock={p.inStock} available={p.available} current={p.options} options={options} mates={mates.map((m) => ({ id: m.id, options: m.options, inStock: m.inStock }))} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {p.description && (
          <section aria-labelledby="about">
            <h2 id="about" className="mb-3 text-xl font-extrabold">About this product</h2>
            <p className="whitespace-pre-line leading-relaxed">{p.description}</p>
          </section>
        )}
        {specs.length > 0 && (
          <section aria-labelledby="specs">
            <h2 id="specs" className="mb-3 text-xl font-extrabold">Details</h2>
            <dl className="card divide-y divide-line">
              {specs.map((s) => <div key={s.label} className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="text-muted">{s.label}</dt><dd className="text-right font-semibold text-ink">{s.value}</dd></div>)}
            </dl>
          </section>
        )}
      </div>

      <section aria-labelledby="reviews">
        <h2 id="reviews" className="mb-3 text-xl font-extrabold">Customer reviews</h2>
        {reviews.count === 0 ? (
          <p className="card p-6 text-sm text-muted">No reviews yet. Reviews come from people who bought this product.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="card p-5 text-center">
              <p className="text-4xl font-extrabold text-ink">{reviews.average.toFixed(1)}</p>
              <div className="mt-1 flex justify-center"><Stars value={reviews.average} /></div>
              <p className="mt-1 text-sm text-muted">{reviews.count} {reviews.count === 1 ? 'review' : 'reviews'}</p>
              <ul className="mt-4 space-y-1.5 text-xs">
                {reviews.split.map((n, k) => <li key={k} className="flex items-center gap-2"><span className="w-3 text-right">{5 - k}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-soft"><span className="block h-full bg-warn" style={{ width: `${(n / reviews.count) * 100}%` }} /></span><span className="w-5 text-muted">{n}</span></li>)}
              </ul>
            </div>
            <ul className="space-y-3">
              {reviews.items.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3"><Stars value={r.rating} /><span className="text-xs text-muted">{dateOnly(r.at)}</span></div>
                  <p className="mt-2 text-sm">{r.text}</p>
                  <p className="mt-2 text-xs text-muted">{r.name}{r.verified ? ' · Verified buyer' : ''}</p>
                  {r.reply && <p className="mt-3 rounded-xl bg-soft p-3 text-sm"><b className="text-ink">ShopCore replied:</b> {r.reply}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="mb-4 text-xl font-extrabold">You may also like</h2>
          <ProductRow items={related} label="You may also like" />
        </section>
      )}

      {sameBrand.length > 0 && (
        <section aria-labelledby="brand-more">
          <h2 id="brand-more" className="mb-4 text-xl font-extrabold">More from {p.brand}</h2>
          <ProductRow items={sameBrand} label={`More from ${p.brand}`} />
        </section>
      )}

      <RecentlyViewed current={p.id} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
