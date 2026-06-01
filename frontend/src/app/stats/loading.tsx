export default function StatsLoading() {
  return (
    <main className="max-w-2xl mx-auto p-4">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-72 bg-gray-100 rounded animate-pulse" />
      </div>
    </main>
  );
}
