'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Icon } from './icons';

/** A row of cards that scrolls sideways, with arrows on a large screen. */
export function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const box = useRef<HTMLUListElement>(null);
  const [can, setCan] = useState({ left: false, right: false });
  const check = () => { const el = box.current; if (el) setCan({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); };
  useEffect(() => { check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check); }, []);
  const by = (dir: 1 | -1) => box.current?.scrollBy({ left: dir * box.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <div className="group/row relative">
      <ul ref={box} aria-label={label} onScroll={check} className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</ul>
      {can.left && <button type="button" aria-label="Scroll left" onClick={() => by(-1)} className="absolute -left-3 top-1/3 hidden h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lg ring-1 ring-line hover:text-brand md:grid"><Icon name="chevron" size={20} className="rotate-180" /></button>}
      {can.right && <button type="button" aria-label="Scroll right" onClick={() => by(1)} className="absolute -right-3 top-1/3 hidden h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lg ring-1 ring-line hover:text-brand md:grid"><Icon name="chevron" size={20} /></button>}
    </div>
  );
}

/** Time left on a sale. Shown only once the page has loaded, so the server and the browser never disagree. */
export function Countdown({ endsAt }: { endsAt: string[] }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const times = endsAt.map((e) => new Date(e).getTime()).filter(Number.isFinite);
    // The clock runs to the next sale that ends.
    const tick = () => { const now = Date.now(); const next = times.find((t) => t > now); setLeft(next ? next - now : 0); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const parts: [number, string][] = [...(d > 0 ? [[d, 'd'] as [number, string]] : []), [Math.floor((s % 86400) / 3600), 'h'], [Math.floor((s % 3600) / 60), 'm'], [s % 60, 's']];
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold" role="timer" aria-label="Time left">
      Ends in
      {parts.map(([n, u]) => <span key={u} className="rounded-md bg-white/20 px-1.5 py-0.5 tabular-nums">{String(n).padStart(2, '0')}{u}</span>)}
    </span>
  );
}
