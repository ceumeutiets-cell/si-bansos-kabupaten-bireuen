import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 print:hidden">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start justify-between p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-slide-up ${
            t.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
              : t.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700'
              : t.type === 'warning'
              ? 'bg-amber-900/90 text-amber-100 border-amber-700'
              : 'bg-slate-900/90 text-slate-100 border-slate-700'
          }`}
        >
          <div className="flex items-start space-x-3">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
            <p className="font-medium text-xs sm:text-sm leading-relaxed">{t.text}</p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
