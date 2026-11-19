/** Shapes the account pages share with the ShopCore API. */
export type NoteKind = 'order' | 'delivery' | 'return' | 'refund' | 'support' | string;
export interface Note { id: string; kind: NoteKind; title: string; body: string; at: string; orderId?: string; ticketId?: string; unread: boolean }
export interface Notifications { items: Note[]; unread: number }

export interface Rewards {
  points: number; valueCents: number; pointValueCents: number; minRedeemPoints: number; earnPerHundredKes: number;
  referral: { code: string; rewardPoints: number; invited: { name: string; rewarded: boolean }[] };
  history: { kind: string; points: number; note: string; couponCode: string | null; at: string }[];
}

export interface Prefs { orders: boolean; returns: boolean; deals: boolean; stock: boolean; recs: boolean; push: boolean; email: boolean; sms: boolean; language: 'en' | 'sw' }

export interface TicketSummary { id: string; number: number | string; subject: string; category: string; status: 'open' | 'pending' | 'escalated' | 'resolved'; order: string | null; createdAt: string; updatedAt: string; csat: number | null }
export interface Message { id: string; from: string; by: string; text: string; at: string }
export interface Ticket extends Omit<TicketSummary, 'updatedAt'> { messages: Message[] }
export interface Chat { id: string; agent: string | null; order: string | null; messages: Message[]; version?: string }

export const TICKET_STATUS: Record<string, string> = { open: 'Open', pending: 'Waiting for you', escalated: 'With a specialist', resolved: 'Resolved' };
