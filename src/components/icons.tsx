import type { ReactNode } from 'react';

/** The shop's line icons (24-point grid, stroke 1.8), the same drawings the app uses. */
const PATHS: Record<string, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  cart: <><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 9H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  categories: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  order: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h3" /><path d="m15 16 1.5 1.5L19 15" /></>,
  delivery: <><path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="1.7" /><circle cx="18" cy="19" r="1.7" /><path d="M6 10h5M6 13h4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1-1.9 1.4-1.9 3.1" /><path d="M12 17.5h.01" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18M7 15h4" /><path d="M16 15h2" /></>,
  mpesa: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M3.5 9h17M7 15h4" /><path d="M16 12.5c1.5 0 2.5 1 2.5 2.2s-1 2.3-2.5 2.3" /></>,
  cash: <><path d="M4 7.5h16v11H4z" /><path d="M4 10h16M8 15h4" /><path d="M17 13.5v3M15.5 15h3" /><path d="M7 4h10" /></>,
  returns: <><path d="M9 7 5 11l4 4" /><path d="M5 11h9a5 5 0 0 1 0 10h-2" /><path d="M15 4h4v5" /><path d="M19 4 9 14" /></>,
  terms: <><path d="M6 3.5h8l4 4V20H6z" /><path d="M14 3.5V8h4M9 12h6M9 15h6M9 18h4" /></>,
  privacy: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15" r="1" /><path d="M12 16v2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  heart: <path d="M12 20s-7-4.4-9-9.2C1.6 7.3 3.8 4 7 4c2 0 3.4 1 5 3 1.6-2 3-3 5-3 3.200 0 5.400 3.300 4 6.800C19 15.600 12 20 12 20z" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  check: <path d="m5 12.500 4.500 4.500L19 7.500" />,
  star: <path d="m12 3.500 2.700 5.500 6 .9-4.400 4.200 1 6-5.300-2.800-5.300 2.800 1-6L3.300 9.900l6-.9z" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  download: <><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>,
  box: <><path d="M3 7.500 12 3l9 4.500v9L12 21l-9-4.500z" /><path d="m3 7.500 9 4.500 9-4.500M12 12v9" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  phone: <><rect x="7" y="2.500" width="10" height="19" rx="2.500" /><path d="M11 18.500h2" /></>,
};

export function Icon({ name, size = 22, className, strokeWidth = 1.8 }: { name: keyof typeof PATHS | string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name] ?? null}
    </svg>
  );
}
