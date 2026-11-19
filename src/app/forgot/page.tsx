'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthCard, Field, FormError } from '@/components/AuthBits';
import { useToast } from '@/components/providers';
import { ApiError, post } from '@/lib/client';
import { isEmail, normalizeKenyanPhone } from '@/lib/format';

export default function ForgotPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'who' | 'code' | 'new'>('who');
  const [who, setWho] = useState('');
  const [id, setId] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await fn(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'); } finally { setBusy(false); }
  };

  if (step === 'who') {
    return (
      <AuthCard title="Forgot your password?" sub="Enter your email or phone number and we’ll send you a code.">
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); const v = who.trim(); const norm = isEmail(v) ? v.toLowerCase() : normalizeKenyanPhone(v); if (!norm) { setError('Enter a valid email or Kenyan phone number'); return; } void run(async () => { await post('customer/auth/forgot', { identifier: norm }); setId(norm); setStep('code'); }); }}>
          <FormError message={error} />
          <Field label="Email or phone number"><input className="input" value={who} onChange={(e) => setWho(e.target.value)} autoComplete="username" /></Field>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
        </form>
        <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-brand hover:underline">Back to log in</Link></p>
      </AuthCard>
    );
  }
  if (step === 'code') {
    return (
      <AuthCard title="Enter your code" sub="If an account matches, we’ve sent a code. It can take a minute.">
        <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); if (!/^\d{4,8}$/.test(code)) { setError('Enter the code we sent you'); return; } void run(async () => { const r = await post<{ resetToken: string }>('customer/auth/verify-reset', { identifier: id, code }); setToken(r.resetToken); setStep('new'); }); }}>
          <FormError message={error} />
          <Field label="Code"><input className="input text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus /></Field>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
        </form>
        <p className="mt-4 text-center text-sm"><button className="font-bold text-brand hover:underline" onClick={() => void run(async () => { await post('customer/auth/forgot', { identifier: id }); toast('We sent you a new code'); })}>Send a new code</button></p>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); if (pw.length < 8) { setError('Use at least 8 characters'); return; } void run(async () => { await post('customer/auth/reset', { resetToken: token, password: pw }); toast('Password changed. Please log in.'); router.replace('/login'); }); }}>
        <FormError message={error} />
        <Field label="New password" hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></Field>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </AuthCard>
  );
}
