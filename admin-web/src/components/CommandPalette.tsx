import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

type Item = { to: string; label: string };

export default function CommandPalette({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((i) => i.label.includes(q));
  }, [items, query]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
      >
        <SearchIcon />
        <span className="flex-1 text-right">ابحث عن صفحة...</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] md:inline">⌘K</kbd>
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-24"
              onClick={() => setOpen(false)}
            >
              <div className="surface-card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اكتب اسم صفحة..."
                  className="w-full border-0 border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none"
                />
                <div className="max-h-80 overflow-y-auto p-2">
                  {filtered.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">ما فيه نتائج</div>
                  ) : (
                    filtered.map((i) => (
                      <button
                        key={i.to}
                        onClick={() => {
                          navigate(i.to);
                          setOpen(false);
                        }}
                        className="block w-full rounded-md px-3 py-2 text-right text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        {i.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
