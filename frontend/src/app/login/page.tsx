'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError('회원가입에 실패했습니다. 다시 시도해 주세요.');
        setLoading(false);
      } else {
        setMessage('가입 완료! 이메일을 확인하거나 바로 로그인해 주세요.');
        setMode('login');
        setLoading(false);
      }
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setMessage('');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">Todo</span>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h1 className="text-[18px] font-semibold text-slate-900 mb-1">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
          <p className="text-[13px] text-slate-400 mb-6">
            {mode === 'login' ? '계정에 로그인하세요' : '새 계정을 만들어보세요'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate-600 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6자 이상 입력해 주세요' : '••••••'}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                required
                minLength={mode === 'signup' ? 6 : undefined}
              />
            </div>

            {error && (
              <p className="text-[13px] text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            {message && (
              <p className="text-[13px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[14px] font-medium hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 mt-2"
            >
              {loading
                ? (mode === 'login' ? '로그인 중...' : '가입 중...')
                : (mode === 'login' ? '로그인' : '회원가입')}
            </button>
          </form>

          {/* 모드 전환 */}
          <div className="mt-5 text-center">
            <span className="text-[13px] text-slate-400">
              {mode === 'login' ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            </span>
            <button
              onClick={switchMode}
              className="ml-1.5 text-[13px] font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
