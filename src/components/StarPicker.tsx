'use client';

import { Icon } from './icons';

/** Choose 1 to 5 stars. Works with the keyboard (it is a group of buttons). */
export function StarPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} aria-pressed={value === n} onClick={() => onChange(n)} className="rounded-md p-1">
          <Icon name="star" size={30} strokeWidth={1.2} className={n <= value ? 'fill-warn text-warn' : 'text-border'} />
        </button>
      ))}
    </div>
  );
}
