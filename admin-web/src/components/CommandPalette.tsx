import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Item = { to: string; label: string };
type Result = { key: string; group: string; label: string; sub?: string; go: () => void };

export default function CommandPalette({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entityResults, setEntityResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
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
    if (!open) {
      setQuery('');
      setEntityResults([]);
    }
  }, [open]);

  const pageResults: Result[] = useMemo(() => {
    const q = query.trim();
    const matches = q ? items.filter((i) => i.label.includes(q)) : items;
    return matches.map((i) => ({ key: `page-${i.to}`, group: 'الصفحات', label: i.label, go: () => navigate(i.to) }));
  }, [items, query, navigate]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setEntityResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const [{ data: destinations }, { data: places }, { data: users }] = await Promise.all([
        supabase.from('destinations').select('id,name,country').ilike('name', `%${q}%`).limit(5),
        supabase.from('places').select('id,name,destination_id').ilike('name', `%${q}%`).limit(5),
        supabase.from('profiles').select('id,name,username').or(`name.ilike.%${q}%,username.ilike.%${q}%`).limit(5),
      ]);
      const results: Result[] = [
        ...(destinations ?? []).map((d) => ({
          key: `dest-${d.id}`,
          group: 'الوجهات',
          label: d.name,
          sub: d.country,
          go: () => navigate(`/destinations/${d.id}`),
        })),
        ...(places ?? []).map((p) => ({
          key: `place-${p.id}`,
          group: 'الأماكن',
          label: p.name,
          go: () => navigate(`/places/${p.id}`),
        })),
        ...(users ?? []).map((u) => ({
          key: `user-${u.id}`,
          group: 'المستخدمون',
          label: u.name,
          sub: `@${u.username}`,
          go: () => navigate('/users', { state: { openUserId: u.id } }),
        })),
      ];
      setEntityResults(results);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, navigate]);

  const allResults = [...pageResults, ...entityResults];
  const groups = Array.from(new Set(allResults.map((r) => r.group)));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
      >
        <SearchIcon />
        <span className="flex-1 text-right">ابحث عن صفحة، مستخدم، أو مكان...</span>
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
                  placeholder="اكتب اسم صفحة، مستخدم، أو مكان..."
                  className="w-full border-0 border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none"
                />
                <div className="max-h-80 overflow-y-auto p-2">
                  {allResults.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">{searching ? 'جاري البحث...' : 'ما فيه نتائج'}</div>
                  ) : (
                    groups.map((group) => (
                      <div key={group} className="mb-1">
                        <div className="px-3 pb-1 pt-2 text-[11px] font-bold text-muted-foreground">{group}</div>
                        {allResults
                          .filter((r) => r.group === group)
                          .map((r) => (
                            <button
                              key={r.key}
                              onClick={() => {
                                r.go();
                                setOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-right text-sm font-semibold text-foreground hover:bg-muted"
                            >
                              <span>{r.label}</span>
                              {r.sub ? <span className="text-xs font-normal text-muted-foreground" dir="ltr">{r.sub}</span> : null}
                            </button>
                          ))}
                      </div>
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
