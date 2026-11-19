'use client';

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

export const safeNext = (n: string | null | undefined) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/account');

export function AuthCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-4 sm:py-10">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  const id = useId();
  const note = error ? `${id}-e` : hint ? `${id}-h` : undefined;
  // The label is tied to the box it describes, so screen readers read it and a click on the label focuses the box.
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, 'aria-describedby': note, 'aria-invalid': error ? true : undefined }) : children;
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {control}
      {hint && !error && <p id={`${id}-h`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-e`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  return message ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger" role="alert">{message}</p> : null;
}
