import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { logAction } from '../lib/auditLog';

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  status: 'open' | 'reviewed';
  created_at: string;
};

type Group = {
  reported_user_id: string;
  reported_user_name: string;
  reportIds: string[];
  reasons: { reporter_name: string; reason: string; created_at: string }[];
  earliestCreatedAt: string;
};

function severityOf(reportCount: number): 'low' | 'medium' | 'high' {
  if (reportCount >= 3) return 'high';
  if (reportCount >= 2) return 'medium';
  return 'low';
}

const SEVERITY_LABEL = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' } as const;
const SEVERITY_CLASS = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-gold-soft text-gold-ink',
  low: 'bg-muted text-muted-foreground',
} as const;

export default function UserReports() {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [reviewedRows, setReviewedRows] = useState<(ReportRow & { reported_user_name?: string })[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from('user_reports')
      .select('id,reporter_id,reported_user_id,reason,status,created_at')
      .order('created_at', { ascending: true });
    const rowsData = data ?? [];
    setRows(rowsData);

    const profileIds = Array.from(new Set(rowsData.flatMap((r) => [r.reporter_id, r.reported_user_id])));
    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('id,name').in('id', profileIds)
      : { data: [] };
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));

    const open = rowsData.filter((r) => r.status === 'open');
    const byUser = new Map<string, Group>();
    for (const r of open) {
      const reason = { reporter_name: names[r.reporter_id] ?? r.reporter_id, reason: r.reason, created_at: r.created_at };
      const existing = byUser.get(r.reported_user_id);
      if (existing) {
        existing.reportIds.push(r.id);
        existing.reasons.push(reason);
        if (r.created_at < existing.earliestCreatedAt) existing.earliestCreatedAt = r.created_at;
      } else {
        byUser.set(r.reported_user_id, {
          reported_user_id: r.reported_user_id,
          reported_user_name: names[r.reported_user_id] ?? r.reported_user_id,
          reportIds: [r.id],
          reasons: [reason],
          earliestCreatedAt: r.created_at,
        });
      }
    }
    setGroups(Array.from(byUser.values()).sort((a, b) => a.earliestCreatedAt.localeCompare(b.earliestCreatedAt)));
    setReviewedRows(
      rowsData
        .filter((r) => r.status === 'reviewed')
        .map((r) => ({ ...r, reported_user_name: names[r.reported_user_id] ?? r.reported_user_id }))
        .reverse()
    );
  };

  useEffect(() => {
    load();
  }, []);

  const markGroupReviewed = async (group: Group) => {
    setBusyKey(group.reported_user_id);
    const { error } = await supabase.from('user_reports').update({ status: 'reviewed' }).in('id', group.reportIds);
    setBusyKey(null);
    if (error) {
      showToast(`تعذّرت مراجعة البلاغات: ${error.message}`);
      return;
    }
    showToast(`تمت مراجعة ${group.reportIds.length} بلاغ`, async () => {
      await supabase.from('user_reports').update({ status: 'open' }).in('id', group.reportIds);
      load();
    });
    logAction({
      type: 'mod',
      action: 'مراجعة بلاغات مستخدم',
      target: `${group.reported_user_name} — ${group.reportIds.length} بلاغ`,
      diff: { status: { before: 'open', after: 'reviewed' } },
    });
    load();
  };

  const groupsWithSeverity = useMemo(
    () => groups.map((g) => ({ group: g, severity: severityOf(g.reportIds.length) })),
    [groups]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">بلاغات المستخدمين</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          بلاغات حظر/إبلاغ من ملفات المستخدمين الشخصية بالتطبيق (مستقلة عن بلاغات المجتمعات). تُجمَّع هنا حسب المستخدم المُبلَّغ
          عنه — شدة عالية من 3 بلاغات فأكثر على نفس الشخص.
        </p>
      </div>

      <div className="surface-card mb-6 divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : groupsWithSeverity.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه بلاغات مفتوحة</div>
        ) : (
          groupsWithSeverity.map(({ group: g, severity }) => (
            <div key={g.reported_user_id} className="flex items-start gap-3 p-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{g.reported_user_name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {g.reportIds.length} بلاغ
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_CLASS[severity]}`}>
                    شدة {SEVERITY_LABEL[severity]}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {g.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {r.reporter_name}: {r.reason} · {new Date(r.created_at).toLocaleDateString('ar')}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2">
                <button
                  onClick={() => markGroupReviewed(g)}
                  disabled={busyKey === g.reported_user_id}
                  className="rounded-md bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  تمت المراجعة
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {reviewedRows.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-foreground">بلاغات مراجَعة</h2>
          <div className="surface-card divide-y divide-border">
            {reviewedRows.map((r) => (
              <div key={r.id} className="p-3 text-xs text-muted-foreground">
                {r.reported_user_name} — {r.reason}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
