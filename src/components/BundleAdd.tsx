'use client';

import { Icon } from './icons';
import { MAX_QTY, useCart, useToast } from './providers';

/** Puts every item of a bundle in the cart. The discount is worked out by the shop when you check out. */
export function BundleAdd({ items, disabled }: { items: { productId: string; quantity: number }[]; disabled?: boolean }) {
  const cart = useCart();
  const { toast } = useToast();
  return (
    <button
      type="button"
      className="btn btn-primary w-full"
      disabled={disabled}
      onClick={() => {
        for (const i of items) {
          const have = cart.lines.find((l) => l.id === i.productId)?.qty ?? 0;
          if (have + i.quantity <= MAX_QTY) cart.add(i.productId, i.quantity);
        }
        toast('Bundle added to your cart');
      }}
    >
      <Icon name="cart" size={18} /> Add bundle to cart
    </button>
  );
}
