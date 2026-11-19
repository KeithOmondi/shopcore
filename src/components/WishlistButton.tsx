'use client';

import { Icon } from './icons';
import { useWishlist } from './providers';

export function WishlistButton({ id, name, label }: { id: string; name: string; label?: boolean }) {
  const { has, toggle } = useWishlist();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void toggle(id); }}
      className={`relative z-10 grid place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-line hover:ring-brand ${label ? 'h-12 gap-2 px-5 text-sm font-semibold' : 'h-9 w-9'} ${label ? 'inline-flex' : ''}`}
    >
      <Icon name="heart" size={label ? 20 : 18} className={on ? 'fill-brand text-brand' : 'text-ink'} />
      {label && <span>{on ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
