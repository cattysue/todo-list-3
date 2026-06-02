import type { Metadata } from 'next';
import QueryProvider from '@/providers/QueryProvider';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo List 3',
  description: '시간 중심 할일 관리 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        <QueryProvider>
          <Sidebar />
          <main className="ml-56 min-h-screen">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
