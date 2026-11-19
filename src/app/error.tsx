'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-10 text-center" role="alert">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">We couldn’t load this page. Check your connection and try again.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
