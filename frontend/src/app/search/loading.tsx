export default function SearchLoading() {
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="h-8 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-10 bg-gray-200 rounded-lg mb-4 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-1/2 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
