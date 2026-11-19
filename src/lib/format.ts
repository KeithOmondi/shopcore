export const kes = (cents: number) => `KES ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const dateTime = (iso: string | number) => new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' });
export const dateOnly = (iso: string | number) => new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium', timeZone: 'Africa/Nairobi' });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v: string) => EMAIL_RE.test(v.trim());
/** 07XX XXX XXX, 7XX…, 254… or +254… becomes +2547XXXXXXXX. Null if it isn't a Kenyan mobile number. */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  const national = digits.startsWith('254') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return /^[17]\d{8}$/.test(national) ? `+254${national}` : null;
}
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
