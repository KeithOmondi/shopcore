import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';

import { Footer } from '@/components/Footer';
import { Header, MobileNav } from '@/components/Header';
import { Providers } from '@/components/providers';
import { getCatalogue } from '@/lib/catalogue';
import { SITE_URL } from '@/lib/server-api';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'ShopCore: shop online, delivered to your door', template: '%s | ShopCore' },
  description: 'Electronics, fashion, home, beauty and groceries delivered across Kenya. Pay with M-Pesa or cash on delivery.',
  openGraph: { siteName: 'ShopCore', type: 'website', locale: 'en_KE' },
};
export const viewport: Viewport = { themeColor: '#c94f00', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The menus come from the shop's own categories. If the shop can't be reached the page still opens, without them.
  const categories = await getCatalogue().then((c) => c.categories.map((x) => ({ handle: x.handle, name: x.name, subs: x.subcategories })), () => []);
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
        <Providers>
          <Header categories={categories} />
          <main id="main" className="mx-auto w-full max-w-7xl px-4 py-4 pb-24 md:py-6 md:pb-6">{children}</main>
          <Footer categories={categories} />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
