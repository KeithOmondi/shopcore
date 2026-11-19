import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '@/components/icons';
import { getCatalogue } from '@/lib/catalogue';
import { CATEGORY_ICON } from '@/lib/category-icons';

export const metadata: Metadata = { title: 'All categories', description: 'Browse everything we sell by category.', alternates: { canonical: '/categories' } };
export const revalidate = 60;

export default async function CategoriesPage() {
  const cat = await getCatalogue();
  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold sm:text-3xl">All categories</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cat.categories.map((c) => (
          <li key={c.id} className="card p-5">
            <Link href={`/c/${c.handle}`} className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-tint text-brand"><Icon name={CATEGORY_ICON[c.handle] ?? 'categories'} size={24} /></span>
              <span className="text-lg font-extrabold text-ink hover:text-brand">{c.name}</span>
            </Link>
            {c.subcategories.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.subcategories.map((s) => <li key={s}><Link href={`/c/${c.handle}?sub=${encodeURIComponent(s)}`} className="block rounded-full bg-soft px-3 py-1 text-sm text-body hover:bg-brand-tint hover:text-brand">{s}</Link></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
