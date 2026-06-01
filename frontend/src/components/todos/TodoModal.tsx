'use client';

import { useEffect } from 'react';

import TodoForm from './TodoForm';
import type { TodoItem } from '@/types/todos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: TodoItem;
}

export default function TodoModal({ isOpen, onClose, initialData }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <TodoForm initialData={initialData} onSuccess={onClose} onCancel={onClose} />
      </div>
    </div>
  );
}
