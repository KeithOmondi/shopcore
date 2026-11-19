'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface BannerView { id: string; title: string; label: string; href: string | null; alt: string; image: string | null }

/** The pictures at the top of the home page. A banner with only a picture is shown edge to edge; one with words gets them laid over it. */
export function BannerCarousel({ banners }: { banners: BannerView[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const n = banners.length;

  const go = useCallback((to: number) => {
    const el = box.current;
    if (!el || !n) return;
    const next = (to + n) % n;
    el.scrollTo({ left: next * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setI(next);
  }, [n]);

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => go(i + 1), 5500);
    return () => clearInterval(t);
  }, [i, n, paused, go]);

  if (!n) return null;
  return (
    <section aria-roledescription="carousel" aria-label="Offers" className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div ref={box} className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}>
        {banners.map((b, k) => {
          const inner = (
            <div className="relative aspect-[16/9] w-full bg-brand-tint sm:aspect-[16/6]">
              {b.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt={b.alt || b.title || 'Offer'} className={`absolute inset-0 h-full w-full ${b.title ? 'object-cover object-right' : 'object-cover'}`} loading={k === 0 ? 'eager' : 'lazy'} fetchPriority={k === 0 ? 'high' : undefined} />
              )}
              {(b.title || b.label) && (
                <div className="absolute inset-0 flex items-center bg-gradient-to-r from-white/90 via-white/60 to-transparent p-6 sm:p-12">
                  <div className="max-w-md">
                    {b.label && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand">{b.label}</span>}
                    {b.title && <h2 className="mt-3 text-2xl font-extrabold leading-tight text-ink sm:text-4xl">{b.title}</h2>}
                  </div>
                </div>
              )}
            </div>
          );
          return (
            <div key={b.id} className="w-full shrink-0 snap-center" role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>
              {b.href ? <Link href={b.href} className="block">{inner}</Link> : inner}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Choose an offer">
          {banners.map((b, k) => <button key={b.id} type="button" aria-label={`Show offer ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-brand' : 'w-2 bg-border'}`} />)}
        </div>
      )}
    </section>
  );
}
