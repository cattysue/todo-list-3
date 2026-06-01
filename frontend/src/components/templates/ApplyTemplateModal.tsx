'use client';

import { useState } from 'react';

interface Props {
  onConfirm: (data: { base_date?: string }) => void;
  onClose: () => void;
}

export function ApplyTemplateModal({ onConfirm, onClose }: Props) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [selectedDate, setSelectedDate] = useState('');

  function handleConfirm() {
    if (mode === 'manual' && !selectedDate) return;
    onConfirm(mode === 'manual' ? { base_date: selectedDate } : {});
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 space-y-4 shadow-xl">
        <h2 className="font-semibold text-lg">마감일 설정 방식</h2>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="auto"
              checked={mode === 'auto'}
              onChange={() => setMode('auto')}
            />
            <span className="text-sm">오늘 기준 자동 설정</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="manual"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
            />
            <span className="text-sm">직접 지정</span>
          </label>
        </div>

        {mode === 'manual' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={mode === 'manual' && !selectedDate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
          >
            불러오기
          </button>
        </div>
      </div>
    </div>
  );
}
