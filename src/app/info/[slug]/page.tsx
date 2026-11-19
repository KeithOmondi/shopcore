import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LegalPage, loadLegal } from '@/components/LegalPage';

type Props = { params: Promise<{ slug: string }> };
const ok = (s: string) => /^[a-z0-9][a-z0-9-]{0,80}$/i.test(s);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = ok(slug) ? await loadLegal(`/${slug}`) : null;
  return p ? { title: p.title, description: p.body.slice(0, 150), alternates: { canonical: `/info/${slug}` } } : { title: 'Page not found' };
}

/** Any other page the shop publishes (About us, Delivery information, and so on). */
export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  if (!ok(slug)) notFound();
  return <LegalPage slug={`/${slug}`} />;
}
