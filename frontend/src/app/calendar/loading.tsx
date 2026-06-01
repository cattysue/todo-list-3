export default function CalendarLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40 mb-4" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}
