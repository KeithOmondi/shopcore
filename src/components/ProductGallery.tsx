'use client';

import { useState } from 'react';

import { ProductImage } from './ProductCard';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [null];
  const current = Math.min(i, list.length - 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="card aspect-square overflow-hidden bg-white p-4"><ProductImage src={list[current]} alt={name} /></div>
      {list.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="More pictures">
          {list.map((src, k) => (
            <li key={k} className="shrink-0">
              <button type="button" aria-label={`Show picture ${k + 1}`} aria-current={k === current} onClick={() => setI(k)} className={`card h-16 w-16 overflow-hidden bg-white p-1 ${k === current ? 'ring-2 ring-brand' : ''}`}><ProductImage src={src} alt="" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
