import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Toast = { id: number; message: string; undo?: () => void };

type ToastState = {
  showToast: (message: string, undo?: () => void) => void;
};

const ToastContext = createContext<ToastState | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, undo?: () => void) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, undo }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), undo ? 6000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-md bg-navy px-4 py-2.5 text-sm text-white shadow-lg">
            <span>{t.message}</span>
            {t.undo ? (
              <button
                onClick={() => {
                  t.undo?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-bold hover:bg-white/25"
              >
                تراجع
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
