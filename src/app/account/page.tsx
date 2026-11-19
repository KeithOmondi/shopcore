'use client';

import { useEffect, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { useAuth, useToast } from '@/components/providers';
import { ApiError, get, patch, post } from '@/lib/client';
import { dateOnly, isEmail } from '@/lib/format';

interface Profile { id: string; fullName: string; email: string; phone: string; joinedAt: string }

export default function ProfilePage() {
  const { reload } = useAuth();
  const { toast } = useToast();
  const [p, setP] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwErr, setPwErr] = useState('');

  useEffect(() => { get<Profile>('customer/me').then((r) => { setP(r); setName(r.fullName); setEmail(r.email); }, (e) => setErr(e instanceof ApiError ? e.message : 'Couldn’t load your profile')); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr('Enter your full name'); return; }
    if (!isEmail(email)) { setErr('Enter a valid email address'); return; }
    setBusy(true); setErr('');
    try { const r = await patch<Profile>('customer/me', { fullName: name.trim(), email: email.trim().toLowerCase() }); setP(r); await reload(); toast('Profile saved'); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t save'); } finally { setBusy(false); }
  };
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current) { setPwErr('Enter your current password'); return; }
    if (pw.next.length < 8) { setPwErr('Use at least 8 characters for the new password'); return; }
    setBusy(true); setPwErr('');
    try { await post('customer/me/password', { currentPassword: pw.current, newPassword: pw.next }); setPw({ current: '', next: '' }); toast('Password changed'); }
    catch (e2) { setPwErr(e2 instanceof ApiError ? e2.message : 'Couldn’t change your password'); } finally { setBusy(false); }
  };

  if (!p && !err) return <div className="skeleton h-72" aria-busy="true" />;
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold">My profile</h1>
      <form onSubmit={save} className="card space-y-4 p-5" noValidate>
        <FormError message={err} />
        <Field label="Full name"><input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Phone number" hint="Your phone number can’t be changed here. Contact us if you need to change it."><input className="input bg-soft" value={p?.phone ?? ''} readOnly /></Field>
        {p && <p className="text-xs text-muted">Member since {dateOnly(p.joinedAt)}</p>}
        <button className="btn btn-primary" disabled={busy}>Save changes</button>
      </form>
      <form onSubmit={changePw} className="card space-y-4 p-5" noValidate>
        <h2 className="text-lg font-extrabold">Change password</h2>
        <FormError message={pwErr} />
        <Field label="Current password"><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((x) => ({ ...x, current: e.target.value }))} /></Field>
        <Field label="New password" hint="At least 8 characters."><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((x) => ({ ...x, next: e.target.value }))} /></Field>
        <button className="btn btn-light" disabled={busy}>Change password</button>
      </form>
    </div>
  );
}
