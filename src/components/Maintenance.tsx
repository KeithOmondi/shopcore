import { Icon } from './icons';

/** Shown instead of the shop while the shop is closed for planned work (switched on by staff in the admin). */
export function Maintenance({ message, returnAt }: { message: string; returnAt: string | null }) {
  const back = returnAt ? new Date(returnAt) : null;
  const when = back && !Number.isNaN(back.getTime()) ? back.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }) : null;
  return (
    <main id="main" className="grid min-h-screen place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-tint text-brand"><Icon name="box" size={32} /></span>
        <p className="mt-6 text-2xl font-extrabold tracking-tight text-ink">shop<span className="text-brand">core</span></p>
        <h1 className="mt-4 text-3xl font-extrabold">We’ll be right back</h1>
        <p className="mt-3 text-body">{message || 'We’re making some improvements. Thank you for your patience.'}</p>
        {when && <p className="mt-3 text-sm font-semibold text-ink">Expected back: {when}</p>}
      </div>
    </main>
  );
}
