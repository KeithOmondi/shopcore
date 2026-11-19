import type { Slim } from './types';

export interface DeliveryArea { name: string; zone: string; feeCents: number }
export interface DeliveryAreas { counties: { county: string; areas: DeliveryArea[] }[]; baseFeeCents: number; minBasketCents: number }

export interface Quote {
  lines: { productId: string; quantity: number; listCents: number; unitCents: number; onSale: boolean; available: number }[];
  unavailable: string[];
  subtotalCents: number; deliveryFeeCents: number; discountCents: number; totalCents: number;
  bundle: { id: string; name: string; discountCents: number } | null;
  coupon: { id: string; code: string; discountCents: number } | null;
  minBasketCents: number;
  issues: { code: string; message: string; productId?: string; available?: number }[];
  canOrder: boolean;
}

export interface PlacedOrder { id: string; orderNumber: string; status: string; totalCents: number; paymentMethod: 'mpesa' | 'card' | 'cod' | null }
export interface MpesaStatus { status: 'pending' | 'success' | 'failed' | 'cancelled'; message: string | null; receipt: string | null }

export type OrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled';
export interface OrderStep { key: string; title: string; at: string | null; state: 'done' | 'current' | 'todo'; note?: string }
export interface OrderDetail {
  id: string; number: string; status: OrderStatus; placedAt: string; paidAt: string | null; deliveredAt: string | null; cancelledAt: string | null; cancelReason: string | null;
  paymentMethod: 'mpesa' | 'card' | 'cod' | null; paid: boolean; cashDueCents: number; awaitingPayment: boolean; canCancel: boolean; canTrack: boolean;
  totals: { subtotalCents: number; deliveryFeeCents: number; discountCents: number; totalCents: number; refundedCents: number };
  items: { productId: string; name: string; quantity: number; unitPriceCents: number }[];
  itemCount: number;
  delivery: { name: string; phone: string; area: string; address: string } | null;
  returns: { id: string; number: string; item: string; qty: number; reason: string; status: string; message: string; at: string }[];
  refunds: { id: string; number: string; amountCents: number; reason: string; status: string }[];
  review: { rating: number; text: string; at: string; reply: string | null } | null;
  riderRating: { stars: number; comment: string } | null;
  tracking: { steps: OrderStep[]; failure: string | null; rider: { name: string; phone: string | null; vehicle: string | null; plate: string | null } | null; handoverCode: string | null; riderLocation: { lat: number; lng: number; at: string | null } | null };
}
export interface OrderSummary { id: string; number: string; status: OrderStatus; placedAt: string; paid: boolean; paymentMethod: 'mpesa' | 'card' | 'cod' | null; itemCount: number; totals: { totalCents: number }; items: { productId: string; name: string; quantity: number }[]; awaitingPayment: boolean }

export const METHOD_TEXT = { mpesa: 'M-Pesa', card: 'Card', cod: 'Cash on delivery' } as const;
export const STATUS_TEXT: Record<string, string> = { processing: 'Processing', in_transit: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled' };

export async function loadSlims(ids: string[]): Promise<Record<string, Slim>> {
  if (!ids.length) return {};
  const r = await fetch(`/api/catalogue/products?ids=${ids.join(',')}`);
  if (!r.ok) return {};
  const { items } = (await r.json()) as { items: Slim[] };
  return Object.fromEntries(items.map((s) => [s.id, s]));
}

export const newKey = () => `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
