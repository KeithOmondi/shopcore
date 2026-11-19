'use client';

import { Icon } from './icons';
import { useCart, useToast } from './providers';

/** "Add to cart" straight from a product card. */
export function QuickAdd({ id, name, available }: { id: string; name: string; available: number }) {
  const cart = useCart();
  const { toast } = useToast();
  const inCart = cart.lines.find((l) => l.id === id)?.qty ?? 0;
  return (
    <button
      type="button"
      className="btn btn-primary relative z-10 min-h-10 w-full text-sm"
      aria-label={`Add ${name} to cart`}
      onClick={() => {
        if (available > 0 && inCart + 1 > available) { toast(`Only ${available} available`, 'error'); return; }
        cart.add(id, 1);
        toast('Added to your cart');
      }}
    >
      <Icon name="cart" size={18} /> Add to cart{inCart > 0 ? ` (${inCart})` : ''}
    </button>
  );
}
