'use client';

import { useEffect, useState } from 'react';

import { Field, FormError } from '@/components/AuthBits';
import { useToast } from '@/components/providers';
import { ApiError, del, get, patch, post } from '@/lib/client';
import { normalizeKenyanPhone } from '@/lib/format';
import type { DeliveryAreas } from '@/lib/orders';

interface Address { id: string; label: 'Home' | 'Work' | 'Other'; fullName: string; phone: string; county: string; area: string; street: string; isDefault: boolean }
const EMPTY = { label: 'Home' as Address['label'], fullName: '', phone: '', county: '', area: '', street: '', isDefault: false };

export default function AddressesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Address[] | null>(null);
  const [areas, setAreas] = useState<DeliveryAreas | null>(null);
  const [edit, setEdit] = useState<{ id?: string; v: typeof EMPTY } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => get<{ items: Address[] }>('customer/addresses').then((r) => setItems(r.items), (e) => setErr(e instanceof ApiError ? e.message : 'Couldn’t load your addresses'));
  useEffect(() => { void load(); get<DeliveryAreas>('delivery/areas').then(setAreas, () => undefined); }, []);

  const county = areas?.counties.find((c) => c.county === edit?.v.county);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const v = edit.v;
    const phone = normalizeKenyanPhone(v.phone);
    if (v.fullName.trim().length < 2 || !phone || !v.county || !v.area || v.street.trim().length < 3) { setErr('Please fill in every box with a valid value.'); return; }
    setBusy(true); setErr('');
    const body = { label: v.label, fullName: v.fullName.trim(), phone, county: v.county, area: v.area, street: v.street.trim(), isDefault: v.isDefault };
    try { if (edit.id) await patch(`customer/addresses/${edit.id}`, body); else await post('customer/addresses', body); setEdit(null); toast('Address saved'); await load(); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : 'Couldn’t save the address'); } finally { setBusy(false); }
  };
  const remove = async (a: Address) => {
    if (!window.confirm(`Delete the ${a.label} address in ${a.area}?`)) return;
    try { await del(`customer/addresses/${a.id}`); toast('Address deleted'); await load(); } catch (e) { toast(e instanceof ApiError ? e.message : 'Couldn’t delete', 'error'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold">Addresses</h1>{!edit && <button className="btn btn-primary" onClick={() => { setErr(''); setEdit({ v: EMPTY }); }}>Add an address</button>}</div>
      {!edit && err && <FormError message={err} />}
      {edit && (
        <form onSubmit={save} className="card space-y-4 p-5" noValidate>
          <h2 className="text-lg font-extrabold">{edit.id ? 'Edit address' : 'New address'}</h2>
          <FormError message={err} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label"><select className="input" value={edit.v.label} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, label: e.target.value as Address['label'] } })}><option>Home</option><option>Work</option><option>Other</option></select></Field>
            <Field label="Full name"><input className="input" value={edit.v.fullName} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, fullName: e.target.value } })} /></Field>
            <Field label="Phone number"><input className="input" type="tel" value={edit.v.phone} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, phone: e.target.value } })} /></Field>
            <Field label="County"><select className="input" value={edit.v.county} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, county: e.target.value, area: '' } })}><option value="">Choose a county</option>{areas?.counties.map((c) => <option key={c.county}>{c.county}</option>)}</select></Field>
            <Field label="Area"><select className="input" value={edit.v.area} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, area: e.target.value } })} disabled={!county}><option value="">{county ? 'Choose your area' : 'Choose a county first'}</option>{county?.areas.map((a) => <option key={a.name}>{a.name}</option>)}</select></Field>
            <Field label="Street, building or landmark"><input className="input" value={edit.v.street} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, street: e.target.value } })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={edit.v.isDefault} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, isDefault: e.target.checked } })} /> Use as my default address</label>
          <div className="flex gap-3"><button className="btn btn-primary" disabled={busy}>Save address</button><button type="button" className="btn btn-light" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      {!items && !err && <div className="skeleton h-28" aria-busy="true" />}
      {items && !items.length && !edit && <div className="card p-10 text-center text-sm text-muted">You haven’t saved an address yet.</div>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {items?.map((a) => (
          <li key={a.id} className="card space-y-1 p-4 text-sm">
            <p className="flex items-center gap-2"><b className="text-ink">{a.label}</b>{a.isDefault && <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-bold text-brand">Default</span>}</p>
            <p>{a.fullName} · {a.phone}</p><p>{a.street}</p><p className="text-muted">{a.area}, {a.county}</p>
            <div className="flex gap-4 pt-2"><button className="font-bold text-brand hover:underline" onClick={() => { setErr(''); setEdit({ id: a.id, v: { label: a.label, fullName: a.fullName, phone: a.phone, county: a.county, area: a.area, street: a.street, isDefault: a.isDefault } }); }}>Edit</button><button className="font-bold text-danger hover:underline" onClick={() => void remove(a)}>Delete</button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
