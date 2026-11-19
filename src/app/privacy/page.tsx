import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy policy' };
export const revalidate = 300;

export default function Privacy() { return <LegalPage slug="/privacy" />; }
