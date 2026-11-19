import { NextRequest, NextResponse } from 'next/server';

import { getCatalogue, slim } from '@/lib/catalogue';

/** The name, price and picture for a handful of products (the cart and the order pages ask for these). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 60);
  if (!ids.length) return NextResponse.json({ items: [] });
  const cat = await getCatalogue();
  const want = new Set(ids);
  return NextResponse.json({ items: cat.products.filter((p) => want.has(p.id)).map(slim) }, { headers: { 'cache-control': 'public, max-age=30, s-maxage=60' } });
}
