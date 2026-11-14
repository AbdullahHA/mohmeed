import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { canAccess, type AdminRole, type PageKey } from '../lib/roles';
import { BellIcon } from './icons';

type AlertSource = { to: PageKey; label: string; count: number };

const SOURCES: { to: PageKey; label: string; table: string; column: string; value: string | string[] }[] = [
  { to: '/community-requests', label: 'طلبات إنشاء مجتمعات', table: 'community_requests', column: 'status', value: 'pending' },
  { to: '/community-reports', label: 'بلاغات المجتمعات', table: 'community_reports', column: 'status', value: 'open' },
  { to: '/user-reports', label: 'بلاغات المستخدمين', table: 'user_reports', column: 'status', value: 'open' },
  { to: '/support', label: 'تذاكر دعم مفتوحة', table: 'support_tickets', column: 'status', value: ['open', 'in_progress'] },
];

// Real counts pulled from the same tables each page already queries — not
// a cosmetic badge. Polls every 60s so the number stays roughly live
// without hammering the DB on every render.
export function useAlertSources(role: AdminRole) {
  const [sources, setSources] = useState<AlertSource[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const applicable = SOURCES.filter((s) => canAccess(role, s.to));
      const results = await Promise.all(
        applicable.map(async (s) => {
          const query = supabase.from(s.table).select('id', { count: 'exact', head: true });
          const { count } = Array.isArray(s.value) ? await query.in(s.column, s.value) : await query.eq(s.column, s.value);
          return { to: s.to, label: s.label, count: count ?? 0 };
        })
      );
      if (!cancelled) setSources(results.filter((r) => r.count > 0));
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [role]);

  return sources;
}

export default function AlertsBell({ role }: { role: AdminRole }) {
  const sources = useAlertSources(role);
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="التنبيهات"
        aria-expanded={open}
        className="relative rounded-md border border-border bg-card p-2 text-muted-foreground hover:bg-muted"
      >
        <BellIcon size={18} />
        {total > 0 ? (
          <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-md border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-2 text-xs font-bold text-foreground">تنبيهات تحتاج إجراء</div>
          {sources.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">ما فيه شي يحتاج إجراء الحين</div>
          ) : (
            <div className="divide-y divide-border">
              {sources.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  <span>{s.label}</span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">{s.count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
