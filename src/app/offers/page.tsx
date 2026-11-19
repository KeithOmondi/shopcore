import type { Metadata } from 'next';
import Link from 'next/link';

import { BundleAdd } from '@/components/BundleAdd';
import { Icon } from '@/components/icons';
import { ProductImage } from '@/components/ProductCard';
import { getBundles, getCatalogue, getProgrammes } from '@/lib/catalogue';
import { kes } from '@/lib/format';

export const metadata: Metadata = { title: 'Offers and rewards', description: 'Bundle deals, loyalty points and referral rewards.', alternates: { canonical: '/offers' } };

export default async function OffersPage() {
  const [bundles, prog, cat] = await Promise.all([getBundles(), getProgrammes(), getCatalogue().catch(() => null)]);
  const byId = new Map((cat?.products ?? []).map((p) => [p.id, p]));
  const live = bundles.map((b) => {
    const lines = b.items.map((i) => ({ ...i, p: byId.get(i.productId) })).filter((l): l is typeof l & { p: NonNullable<typeof l.p> } => !!l.p);
    const standalone = lines.reduce((n, l) => n + l.p.priceCents * l.quantity, 0);
    const price = b.priceCents > 0 ? b.priceCents : b.percent > 0 ? Math.round(standalone * (1 - b.percent / 100)) : standalone;
    return { b, lines, standalone, price, ok: lines.length === b.items.length && lines.length > 0 && lines.every((l) => l.p.inStock) };
  }).filter((x) => x.lines.length > 0);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Offers and rewards</h1>
        <p className="mt-1 text-muted">Ways to spend less on every order.</p>
      </header>

      <section aria-labelledby="bundles">
        <h2 id="bundles" className="mb-3 text-xl font-extrabold">Bundle deals</h2>
        {!live.length ? <div className="card p-8 text-center text-sm text-muted">No bundle deals right now. <Link href="/deals" className="font-bold text-brand hover:underline">See today’s deals</Link>.</div> : (
          <ul className="grid gap-4 md:grid-cols-2">
            {live.map(({ b, lines, standalone, price, ok }) => (
              <li key={b.id} className="card flex flex-col gap-3 p-5">
                <div><span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand">{b.type}</span><h3 className="mt-2 text-lg font-extrabold">{b.name}</h3>{b.description && <p className="text-sm text-muted">{b.description}</p>}</div>
                <ul className="flex flex-wrap gap-3">
                  {lines.map((l) => <li key={l.p.id} className="w-24"><Link href={`/p/${l.p.id}`} className="block"><div className="aspect-square rounded-xl bg-white ring-1 ring-line"><ProductImage src={l.p.images[0]} alt={l.p.name} /></div><p className="mt-1 line-clamp-2 text-xs text-ink">{l.quantity > 1 ? `${l.quantity} × ` : ''}{l.p.name}</p></Link></li>)}
                </ul>
                <p className="mt-auto flex flex-wrap items-baseline gap-2"><b className="text-2xl font-extrabold text-ink">{kes(price)}</b>{standalone > price && <><s className="text-sm text-muted">{kes(standalone)}</s><span className="text-sm font-bold text-success">Save {kes(standalone - price)}</span></>}</p>
                {b.minItems > 1 && <p className="text-xs text-muted">Add at least {b.minItems} of these to get the deal.</p>}
                <BundleAdd items={b.items} disabled={!ok} />
                {!ok && <p className="text-xs font-semibold text-danger">Some items are out of stock right now.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {prog?.loyalty.active && (
        <section aria-labelledby="loy" className="card space-y-3 p-6">
          <h2 id="loy" className="flex items-center gap-2 text-xl font-extrabold"><Icon name="star" size={22} className="text-warn" /> Loyalty points</h2>
          <p>Earn <b className="text-ink">{prog.loyalty.earnRate} {prog.loyalty.earnRate === 1 ? 'point' : 'points'}</b> for every KES 100 you spend{prog.loyalty.minOrderCents > 0 ? ` on orders of ${kes(prog.loyalty.minOrderCents)} or more` : ''}. Each point is worth {kes(prog.loyalty.pointValueCents)}. Redeem {prog.loyalty.minRedeem} points or more for a discount code.</p>
          {prog.loyalty.bonuses.filter((x) => x.on).length > 0 && <ul className="grid gap-2 sm:grid-cols-2">{prog.loyalty.bonuses.filter((x) => x.on).map((x) => <li key={x.id} className="rounded-xl bg-brand-tint p-3 text-sm"><b className="block text-ink">{x.name}</b>{x.sub}</li>)}</ul>}
          {prog.loyalty.expiry && <p className="text-xs text-muted">Points expire after {prog.loyalty.expiry}.</p>}
          <Link href="/account/rewards" className="btn btn-light">See my points</Link>
        </section>
      )}

      {prog?.referral.active && (
        <section aria-labelledby="ref" className="card space-y-3 p-6">
          <h2 id="ref" className="flex items-center gap-2 text-xl font-extrabold"><Icon name="heart" size={22} className="text-brand" /> Invite a friend</h2>
          <p>{prog.referral.message}</p>
          <p className="text-sm text-muted">You get: <b className="text-ink">{prog.referral.advocate}</b>. They get: <b className="text-ink">{prog.referral.friend}</b>.{prog.referral.minSpendCents > 0 ? ` Their first order must be at least ${kes(prog.referral.minSpendCents)}.` : ''}</p>
          <Link href="/account/rewards" className="btn btn-primary">Get my invite code</Link>
        </section>
      )}
    </div>
  );
}
