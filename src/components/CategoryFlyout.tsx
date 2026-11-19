import Link from 'next/link';

import { Icon } from './icons';

export interface NavCategory { handle: string; name: string; subs: string[] }

/** A list of categories; pointing at one (or tabbing into it) opens its sub-categories beside it. Works without scripts. */
export function CategoryFlyout({ categories, className = '' }: { categories: NavCategory[]; className?: string }) {
  return (
    <ul className={className}>
      {categories.map((c) => (
        <li key={c.handle} className="group relative">
          <Link href={`/c/${c.handle}`} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-tint hover:text-brand focus-visible:bg-brand-tint">
            {c.name}<Icon name="chevron" size={14} className="text-muted" />
          </Link>
          {c.subs.length > 0 && (
            <div className="invisible absolute left-full top-0 z-50 -ml-px min-h-full w-72 rounded-r-xl border border-line bg-white p-3 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-muted">{c.name}</p>
              <ul>
                {c.subs.map((s) => <li key={s}><Link href={`/c/${c.handle}?sub=${encodeURIComponent(s)}`} className="block rounded-lg px-2 py-1.5 text-sm text-body hover:bg-soft hover:text-brand">{s}</Link></li>)}
              </ul>
              <Link href={`/c/${c.handle}`} className="mt-1 block px-2 py-1.5 text-sm font-bold text-brand hover:underline">See all {c.name}</Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
