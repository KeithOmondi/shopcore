'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthCard, Field, FormError, safeNext } from '@/components/AuthBits';
import { useAuth, useToast } from '@/components/providers';
import { ApiError, post } from '@/lib/client';
import { isEmail, normalizeKenyanPhone } from '@/lib/format';

function SignUpForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { verifySignup } = useAuth();
  const { toast } = useToast();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', referral: '', terms: false });
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fe, setFe] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.fullName.trim().length < 2) errs.fullName = 'Enter your full name';
    if (!isEmail(f.email)) errs.email = 'Enter a valid email address';
    const p = normalizeKenyanPhone(f.phone);
    if (!p) errs.phone = 'Enter a valid Kenyan number, such as 712 345 678';
    if (f.password.length < 8) errs.password = 'Use at least 8 characters';
    if (f.referral.trim() && !/^[A-Za-z0-9]{6,12}$/.test(f.referral.trim())) errs.referral = 'An invite code has 6 to 12 letters and numbers';
    if (!f.terms) errs.terms = 'Please accept the Terms and Privacy Policy';
    setFe(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setError('');
    try {
      await post('customer/auth/signup', { fullName: f.fullName.trim(), email: f.email.trim().toLowerCase(), phone: p, password: f.password, ...(f.referral.trim() ? { referralCode: f.referral.trim().toUpperCase() } : {}) });
      setPhone(p!);
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(code.trim())) { setFe({ code: 'Enter the code we sent you' }); return; }
    setFe({}); setBusy(true); setError('');
    try { await verifySignup(phone, code.trim()); toast('Welcome to ShopCore'); router.replace(next); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };
  const resend = async () => { try { await post('customer/auth/resend', { phone }); toast('We sent you a new code'); } catch (err) { toast(err instanceof ApiError ? err.message : 'Couldn’t send a new code', 'error'); } };

  if (step === 'code') {
    return (
      <AuthCard title="Enter your code" sub={`We sent a code by text to ${phone.replace(/^\+254(\d{3})\d{3}(\d{3})$/, '+254 $1 ••• $2')}.`}>
        <form onSubmit={verify} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label="Code" error={fe.code}><input className="input text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus /></Field>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Checking…' : 'Verify and continue'}</button>
        </form>
        <div className="mt-4 flex justify-between text-sm"><button className="font-bold text-brand hover:underline" onClick={resend}>Send a new code</button><button className="font-bold text-muted hover:underline" onClick={() => setStep('form')}>Change my details</button></div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" sub="It only takes a minute. We’ll text you a code to confirm your number.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Full name" error={fe.fullName}><input className="input" autoComplete="name" value={f.fullName} onChange={set('fullName')} /></Field>
        <Field label="Email" error={fe.email}><input className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone number" error={fe.phone} hint="Used for delivery and M-Pesa."><input className="input" type="tel" autoComplete="tel" placeholder="712 345 678" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Password" error={fe.password} hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Invite code (optional)" error={fe.referral}><input className="input uppercase" value={f.referral} onChange={set('referral')} maxLength={12} /></Field>
        <div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" checked={f.terms} onChange={set('terms')} /><span>I agree to the <Link href="/terms" target="_blank" className="font-bold text-brand hover:underline">Terms of service</Link> and <Link href="/privacy" target="_blank" className="font-bold text-brand hover:underline">Privacy policy</Link>.</span></label>
          {fe.terms && <p className="field-error" role="alert">{fe.terms}</p>}
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand hover:underline">Log in</Link></p>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return <Suspense fallback={<div className="skeleton mx-auto h-96 max-w-md" />}><SignUpForm /></Suspense>;
}
