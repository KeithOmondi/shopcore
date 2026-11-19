import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShopCore',
    short_name: 'ShopCore',
    description: 'Shop online and get it delivered. Pay with M-Pesa or cash on delivery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f0',
    theme_color: '#c94f00',
  };
}
