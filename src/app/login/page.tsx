'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthCard, Field, FormError, safeNext } from '@/components/AuthBits';
import { useAuth } from '@/components/providers';
import { ApiError } from '@/lib/client';
import { isEmail, normalizeKenyanPhone } from '@/lib/format';

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { user, logIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fe, setFe] = useState<{ identifier?: string; password?: string }>({});

  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fe = {};
    const id = identifier.trim();
    if (!isEmail(id) && !normalizeKenyanPhone(id)) errs.identifier = 'Enter your email or Kenyan phone number';
    if (!password) errs.password = 'Enter your password';
    setFe(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setError('');
    try {
      await logIn(isEmail(id) ? id.toLowerCase() : normalizeKenyanPhone(id)!, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? (err.status === 401 ? 'That email, phone number or password isn’t right.' : err.message) : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <AuthCard title="Log in" sub="Welcome back. Log in to check out and see your orders.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email or phone number" error={fe.identifier}><input className="input" autoComplete="username" inputMode="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></Field>
        <Field label="Password" error={fe.password}><input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <div className="text-right"><Link href="/forgot" className="text-sm font-bold text-brand hover:underline">Forgot password?</Link></div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="mt-6 text-center text-sm">New to ShopCore? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold text-brand hover:underline">Create an account</Link></p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="skeleton mx-auto h-80 max-w-md" />}><LoginForm /></Suspense>;
}
