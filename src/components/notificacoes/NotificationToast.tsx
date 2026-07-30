'use client';

import { useState, useEffect, useCallback } from 'react';

interface ToastData {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: string;
  icone?: string;
  urlDestino?: string;
}

// Simple event emitter for toasts
let listeners: Array<(toast: ToastData) => void> = [];

export function mostrarToast(toast: ToastData) {
  listeners.forEach(l => l(toast));
}

export function useToastListener(onToast: (toast: ToastData) => void) {
  useEffect(() => {
    listeners.push(onToast);
    return () => { listeners = listeners.filter(l => l !== onToast); };
  }, [onToast]);
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<(ToastData & { _id: number })[]>([]);
  let counter = 0;

  useToastListener((toast) => {
    const id = ++counter;
    setToasts(prev => [...prev.slice(-2), { ...toast, _id: id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t._id !== id));
    }, 5000);
  });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => (
        <div key={t._id}
          onClick={() => { if (t.urlDestino) window.location.href = t.urlDestino; }}
          className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 cursor-pointer hover:border-brand-300 transition-colors animate-slide-in">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">{t.icone || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold text-slate-700">{t.titulo}</p>
                {t.prioridade === 'CRITICA' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600">CRÍTICA</span>
                )}
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">{t.mensagem}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
