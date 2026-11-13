import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[91] flex w-full max-w-md flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>,
    document.body
  );
}
