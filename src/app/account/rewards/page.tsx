'use client';

import { useEffect, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { useToast } from '@/components/providers';
import type { Rewards } from '@/lib/account';
import { ApiError, get, post } from '@/lib/client';
import { dateOnly, kes } from '@/lib/format';

export default function RewardsPage() {
  const { toast } = useToast();
  const [r, setR] = useState<Rewards | null>(null);
  const [err, setErr] = useState('');
  const [pts, setPts] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<{ code: string; valueCents: number; expiresInDays: number } | null>(null);
  const load = () => get<Rewards>('customer/rewards').then(setR, (e) => setErr(e instanceof ApiError ? e.message : 'Couldn’t load your rewards'));
  useEffect(() => { void load(); }, []);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r) return;
    const n = Math.floor(Number(pts));
    if (!Number.isFinite(n) || n < r.minRedeemPoints) { setErr(`You can redeem at least ${r.minRedeemPoints} points at a time.`); return; }
    if (n > r.points) { setErr('You don’t have that many points.'); return; }
    setBusy(true); setErr('');
    try { const res = await post<{ code: string; valueCents: number; expiresInDays: number }>('customer/rewards/redeem', { points: n }); setCode(res); setPts(''); await load(); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t redeem your points.'); } finally { setBusy(false); }
  };
  const copy = (t: string) => { void navigator.clipboard?.writeText(t).then(() => toast('Copied'), () => toast('Couldn’t copy', 'error')); };

  if (!r && !err) return <div className="skeleton h-64" aria-busy="true" />;
  if (!r) return <FormError message={err} />;
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">Rewards</h1>
      <section className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-brand to-brand-dark p-6 text-white" aria-label="Your points">
        <div><p className="text-sm text-white/85">Your points</p><p className="text-4xl font-extrabold">{r.points.toLocaleString()}</p><p className="text-sm text-white/85">Worth {kes(r.valueCents)}</p></div>
        <p className="max-w-56 text-sm text-white/90">Earn {r.earnPerHundredKes} {r.earnPerHundredKes === 1 ? 'point' : 'points'} for every KES 100 you spend.</p>
      </section>

      <form onSubmit={redeem} className="card space-y-3 p-5" noValidate>
        <h2 className="text-lg font-extrabold">Turn points into a discount</h2>
        <p className="text-sm text-muted">Each point is worth {kes(r.pointValueCents)}. Redeem at least {r.minRedeemPoints} points. You’ll get a one-time code to use at checkout.</p>
        <FormError message={err} />
        <Field label="Points to redeem"><input className="input" inputMode="numeric" value={pts} onChange={(e) => setPts(e.target.value.replace(/\D/g, ''))} /></Field>
        <button className="btn btn-primary" disabled={busy || r.points < r.minRedeemPoints}>Get my code</button>
        {r.points < r.minRedeemPoints && <p className="text-xs text-muted">You need {r.minRedeemPoints - r.points} more points to redeem.</p>}
      </form>

      {code && (
        <section className="card space-y-2 border-success/40 bg-success/10 p-5" role="status">
          <h2 className="text-lg font-extrabold">Your code is ready</h2>
          <p className="text-3xl font-extrabold tracking-widest text-ink">{code.code}</p>
          <p className="text-sm">Worth {kes(code.valueCents)}. Enter it at checkout within {code.expiresInDays} days.</p>
          <button className="btn btn-light" onClick={() => copy(code.code)}>Copy code</button>
        </section>
      )}

      <section className="card space-y-3 p-5" aria-labelledby="ref">
        <h2 id="ref" className="text-lg font-extrabold">Invite a friend</h2>
        <p className="text-sm text-muted">Share your code. When a friend signs up with it and orders, you get {r.referral.rewardPoints} points.</p>
        <div className="flex flex-wrap items-center gap-3"><b className="rounded-xl bg-soft px-4 py-2 text-xl tracking-widest text-ink">{r.referral.code}</b><button className="btn btn-light" onClick={() => copy(r.referral.code)}>Copy code</button></div>
        {r.referral.invited.length > 0 && <ul className="divide-y divide-line text-sm">{r.referral.invited.map((i, k) => <li key={k} className="flex justify-between py-2"><span>{i.name}</span><span className="text-muted">{i.rewarded ? 'Rewarded' : 'Signed up'}</span></li>)}</ul>}
      </section>

      <section className="card p-5" aria-labelledby="hist">
        <h2 id="hist" className="mb-3 text-lg font-extrabold">History</h2>
        {!r.history.length ? <p className="text-sm text-muted">Your points will show here after your first order.</p> : (
          <ul className="divide-y divide-line text-sm">
            {r.history.map((h, i) => <li key={i} className="flex items-center justify-between gap-3 py-2.5"><span><b className="text-ink">{h.note || h.kind}</b>{h.couponCode && <span className="text-muted"> · {h.couponCode}</span>}<br /><span className="text-xs text-muted">{dateOnly(h.at)}</span></span><b className={h.points >= 0 ? 'text-success' : 'text-ink'}>{h.points > 0 ? '+' : ''}{h.points}</b></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
