const LOADING_SECTIONS = [
  { key: 'today', label: '오늘 마감' },
  { key: 'tomorrow', label: '내일 마감' },
  { key: 'this_week', label: '이번 주 마감' },
] as const;

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-6" aria-label={`${title} 로딩 중`}>
      <div className="animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DashboardLoading() {
  return (
    <main className="max-w-2xl mx-auto p-4">
      {LOADING_SECTIONS.map(({ key, label }) => (
        <SectionSkeleton key={key} title={label} />
      ))}
    </main>
  );
}
