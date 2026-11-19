import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <p className="text-5xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">We couldn’t find that page</h1>
      <p className="mt-1 text-sm text-muted">It may have moved, or the product may no longer be sold.</p>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn btn-primary">Go home</Link><Link href="/shop" className="btn btn-light">Browse products</Link></div>
    </div>
  );
}
