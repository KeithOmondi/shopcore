import type { Metadata } from 'next';

import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms of service' };

export default function Terms() { return <LegalPage slug="/terms" />; }
