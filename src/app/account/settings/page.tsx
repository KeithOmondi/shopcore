'use client';

import { useEffect, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { useAuth, useToast } from '@/components/providers';
import type { Prefs } from '@/lib/account';
import { ApiError, get, patch, post } from '@/lib/client';
import { normalizeKenyanPhone } from '@/lib/format';

const ROWS: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: 'orders', label: 'Order updates', sub: 'Confirmations, dispatch and delivery' },
  { key: 'returns', label: 'Returns and refunds', sub: 'Changes to your requests' },
  { key: 'deals', label: 'Deals and offers', sub: 'Discounts and sales' },
  { key: 'stock', label: 'Back in stock', sub: 'Items on your wishlist' },
  { key: 'recs', label: 'Recommendations', sub: 'Picks based on what you look at' },
  { key: 'email', label: 'Email', sub: 'Send messages to my email' },
  { key: 'sms', label: 'Text messages', sub: 'Send messages to my phone' },
];

export default function SettingsPage() {
  const { user, reload, logOut } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [edits, setEdits] = useState<Partial<Prefs>>({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'idle' | 'code'>('idle');
  const [phoneErr, setPhoneErr] = useState('');
  const [delPw, setDelPw] = useState('');
  const [delErr, setDelErr] = useState('');
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => { get<Prefs>('customer/preferences').then(setPrefs, (e) => setErr(e instanceof ApiError ? e.message : 'Couldn’t load your settings')); }, []);
  const draft = prefs ? { ...prefs, ...edits } : null;
  const changed = Object.keys(edits).length > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { setPrefs(await patch<Prefs>('customer/preferences', edits)); setEdits({}); toast('Settings saved'); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t save your settings'); } finally { setBusy(false); }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizeKenyanPhone(phone);
    if (!p) { setPhoneErr('Enter a valid Kenyan phone number.'); return; }
    setBusy(true); setPhoneErr('');
    try { await post('customer/me/phone', { phone: p }); setPhoneStep('code'); toast('We sent a code to the new number'); }
    catch (e2) { setPhoneErr(e2 instanceof ApiError ? e2.message : 'Couldn’t send the code'); } finally { setBusy(false); }
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setPhoneErr('The code is 6 digits.'); return; }
    setBusy(true); setPhoneErr('');
    try { await post('customer/me/phone/verify', { code }); await reload(); setPhoneStep('idle'); setPhone(''); setCode(''); toast('Phone number changed'); }
    catch (e2) { setPhoneErr(e2 instanceof ApiError ? e2.message : 'That code didn’t work'); } finally { setBusy(false); }
  };

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delPw) { setDelErr('Enter your password to confirm.'); return; }
    if (!window.confirm('Delete your account for good? This cannot be undone.')) return;
    setBusy(true); setDelErr('');
    try {
      await post('customer/me/delete', { password: delPw });
      try { localStorage.removeItem('shopcore.cart.v1'); } catch { /* storage may be off */ }
      await logOut();
    } catch (e2) { setDelErr(e2 instanceof ApiError ? e2.message : 'Couldn’t delete your account'); setBusy(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <form onSubmit={save} className="card space-y-4 p-5" noValidate>
        <h2 className="text-lg font-extrabold">Notifications</h2>
        <FormError message={err} />
        {!draft ? <div className="skeleton h-48" aria-busy="true" /> : (
          <>
            <ul className="divide-y divide-line">
              {ROWS.map((r) => (
                <li key={r.key} className="flex items-center justify-between gap-4 py-3">
                  <label htmlFor={`p-${r.key}`} className="min-w-0 cursor-pointer"><b className="block text-sm text-ink">{r.label}</b><span className="text-xs text-muted">{r.sub}</span></label>
                  <input id={`p-${r.key}`} type="checkbox" className="h-6 w-6 shrink-0 accent-[var(--brand)]" checked={draft[r.key] as boolean} onChange={(e) => setEdits((x) => ({ ...x, [r.key]: e.target.checked }))} />
                </li>
              ))}
            </ul>
            <Field label="Language for messages"><select className="input" value={draft.language} onChange={(e) => setEdits((x) => ({ ...x, language: e.target.value as Prefs['language'] }))}><option value="en">English</option><option value="sw">Kiswahili</option></select></Field>
            <button className="btn btn-primary" disabled={busy || !changed}>Save settings</button>
          </>
        )}
      </form>

      <section className="card space-y-4 p-5" aria-labelledby="ph">
        <h2 id="ph" className="text-lg font-extrabold">Phone number</h2>
        <p className="text-sm text-muted">Now: <b className="text-ink">{user?.phone}</b>. We’ll text a code to the new number to confirm it.</p>
        <FormError message={phoneErr} />
        {phoneStep === 'idle' ? (
          <form onSubmit={sendCode} className="space-y-3" noValidate>
            <Field label="New phone number"><input className="input" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            <button className="btn btn-light" disabled={busy}>Send code</button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3" noValidate>
            <Field label="6-digit code"><input className="input" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></Field>
            <div className="flex gap-3"><button className="btn btn-primary" disabled={busy}>Confirm</button><button type="button" className="btn btn-ghost" onClick={() => { setPhoneStep('idle'); setCode(''); }}>Use another number</button></div>
          </form>
        )}
      </section>

      <section className="card space-y-3 border-danger/30 p-5" aria-labelledby="del">
        <h2 id="del" className="text-lg font-extrabold text-danger">Delete my account</h2>
        <p className="text-sm text-muted">This removes your account, saved addresses and points. Orders already placed are kept for our records. It can’t be undone.</p>
        {!delOpen ? <button className="btn btn-light !text-danger" onClick={() => setDelOpen(true)}>Delete my account…</button> : (
          <form onSubmit={remove} className="space-y-3" noValidate>
            <FormError message={delErr} />
            <Field label="Your password"><input className="input" type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} /></Field>
            <div className="flex gap-3"><button className="btn !bg-danger text-white" disabled={busy}>Delete for good</button><button type="button" className="btn btn-light" onClick={() => { setDelOpen(false); setDelPw(''); }}>Keep my account</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
