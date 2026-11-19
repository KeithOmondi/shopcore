export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="skeleton h-64 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton h-64" />)}
      </div>
    </div>
  );
}
