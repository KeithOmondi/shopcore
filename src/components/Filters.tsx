'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Icon } from './icons';

interface Props {
  brands: { name: string; count: number }[];
  subs: { name: string; count: number }[];
  priceMin: number; // cents
  priceMax: number; // cents
}

/** The filter panel. Every choice is kept in the web address, so a filtered list can be shared and the back button works. */
export function Filters({ brands, subs, priceMin, priceMax }: Props) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(sp.get('min') ?? '');
  const [max, setMax] = useState(sp.get('max') ?? '');
  useEffect(() => { setMin(sp.get('min') ?? ''); setMax(sp.get('max') ?? ''); }, [sp]);

  const selected = sp.getAll('brand');
  const sub = sp.get('sub') ?? '';
  const stock = sp.get('stock') === '1';
  const active = selected.length + (sub ? 1 : 0) + (stock ? 1 : 0) + (sp.get('min') ? 1 : 0) + (sp.get('max') ? 1 : 0);

  const push = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    p.delete('page');
    const s = p.toString();
    router.push(s ? `${path}?${s}` : path, { scroll: false });
  };
  const toggleBrand = (name: string) => push((p) => {
    const cur = p.getAll('brand');
    p.delete('brand');
    (cur.includes(name) ? cur.filter((b) => b !== name) : [...cur, name]).forEach((b) => p.append('brand', b));
  });
  const applyPrice = () => push((p) => { if (min) p.set('min', String(Math.max(0, Math.floor(Number(min))))); else p.delete('min'); if (max) p.set('max', String(Math.max(0, Math.floor(Number(max))))); else p.delete('max'); });
  const clear = () => { const keep = new URLSearchParams(); const q = sp.get('q'); if (q) keep.set('q', q); const s = keep.toString(); router.push(s ? `${path}?${s}` : path, { scroll: false }); };

  const panel = (
    <div className="space-y-6">
      {subs.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">Type</legend>
          <ul className="space-y-1">
            <li><button type="button" onClick={() => push((p) => p.delete('sub'))} className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${!sub ? 'bg-brand-tint font-bold text-brand' : 'hover:bg-soft'}`}>All</button></li>
            {subs.map((s) => (
              <li key={s.name}><button type="button" onClick={() => push((p) => p.set('sub', s.name))} className={`flex w-full justify-between rounded-lg px-2 py-1.5 text-left text-sm ${sub === s.name ? 'bg-brand-tint font-bold text-brand' : 'hover:bg-soft'}`}><span>{s.name}</span><span className="text-muted">{s.count}</span></button></li>
            ))}
          </ul>
        </fieldset>
      )}
      {brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">Brand</legend>
          <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {brands.map((b) => (
              <li key={b.name}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-soft">
                  <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={selected.includes(b.name)} onChange={() => toggleBrand(b.name)} />
                  <span className="flex-1">{b.name}</span><span className="text-muted">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Price (KES)</legend>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); applyPrice(); }}>
          <input aria-label="Lowest price" inputMode="numeric" className="input !min-h-10 !rounded-lg" placeholder={String(Math.floor(priceMin / 100))} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
          <span aria-hidden>–</span>
          <input aria-label="Highest price" inputMode="numeric" className="input !min-h-10 !rounded-lg" placeholder={String(Math.ceil(priceMax / 100))} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
          <button type="submit" className="btn btn-light !min-h-10 !px-3 text-sm">Go</button>
        </form>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={stock} onChange={() => push((p) => { if (stock) p.delete('stock'); else p.set('stock', '1'); })} />
        In stock only
      </label>
      {active > 0 && <button type="button" onClick={clear} className="text-sm font-bold text-brand hover:underline">Clear all filters</button>}
    </div>
  );

  return (
    <>
      <button type="button" className="btn btn-light !min-h-10 lg:hidden" onClick={() => setOpen(true)}><Icon name="filter" size={18} /> Filters{active ? ` (${active})` : ''}</button>
      <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filters">{panel}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Filters</h2><button aria-label="Close" onClick={() => setOpen(false)}><Icon name="close" /></button></div>
            <div className="flex-1 overflow-y-auto">{panel}</div>
            <button className="btn btn-primary mt-4" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ hasQuery }: { hasQuery: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const value = sp.get('sort') ?? (hasQuery ? 'relevance' : 'new');
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-ink">Sort</span>
      <select
        className="input !min-h-10 !w-auto !rounded-lg pr-8"
        value={value}
        onChange={(e) => { const p = new URLSearchParams(sp.toString()); p.set('sort', e.target.value); p.delete('page'); router.push(`${path}?${p.toString()}`, { scroll: false }); }}
      >
        {hasQuery && <option value="relevance">Best match</option>}
        <option value="new">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </label>
  );
}
