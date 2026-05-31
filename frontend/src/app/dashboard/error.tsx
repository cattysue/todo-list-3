'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-2xl mx-auto p-4">
      <p role="alert" className="text-red-600 mb-4">
        페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        다시 시도
      </button>
    </main>
  );
}
