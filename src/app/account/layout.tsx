'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Icon } from '@/components/icons';
import { useAuth } from '@/components/providers';

const LINKS = [
  { href: '/account', label: 'Profile', icon: 'profile' },
  { href: '/account/orders', label: 'My orders', icon: 'order' },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'heart' },
  { href: '/account/addresses', label: 'Addresses', icon: 'home' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (user === null) router.replace(`/login?next=${encodeURIComponent(path)}`); }, [user, router, path]);
  if (user === undefined) return <div className="space-y-3" aria-busy="true"><div className="skeleton h-10 w-48" /><div className="skeleton h-64" /></div>;
  if (user === null) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="My account" className="lg:sticky lg:top-28 lg:h-fit">
        <p className="mb-3 hidden text-sm text-muted lg:block">Signed in as<br /><b className="text-ink">{user.fullName}</b></p>
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {LINKS.map((l) => {
            const on = l.href === '/account' ? path === '/account' : path.startsWith(l.href);
            return <li key={l.href} className="shrink-0"><Link href={l.href} aria-current={on ? 'page' : undefined} className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold lg:rounded-xl ${on ? 'bg-brand-tint text-brand' : 'text-ink hover:bg-soft'}`}><Icon name={l.icon} size={20} />{l.label}</Link></li>;
          })}
          <li className="shrink-0"><button onClick={() => void logOut()} className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-danger hover:bg-soft lg:rounded-xl"><Icon name="lock" size={20} />Log out</button></li>
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
