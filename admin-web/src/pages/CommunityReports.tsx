import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { logAction } from '../lib/auditLog';

type ReportRow = {
  id: string;
  community_id: string;
  reporter_id: string;
  reported_message_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: 'open' | 'reviewed';
  created_at: string;
};

type Severity = 'low' | 'medium' | 'high';

type Group = {
  targetKey: string;
  community_id: string;
  community_name: string;
  reported_message_id: string | null;
  reported_user_id: string | null;
  reported_user_name?: string;
  message_text?: string;
  message_from_name?: string;
  reportIds: string[];
  reasons: { reporter_name: string; reason: string; created_at: string }[];
  earliestCreatedAt: string;
};

const SLA_HOURS: Record<Severity, number> = { high: 24, medium: 72, low: 72 };
const SEVERITY_LABEL: Record<Severity, string> = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };
const SEVERITY_CLASS: Record<Severity, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-gold-soft text-gold-ink',
  low: 'bg-muted text-muted-foreground',
};

function severityOf(reportCount: number): Severity {
  if (reportCount >= 3) return 'high';
  if (reportCount >= 2) return 'medium';
  return 'low';
}

function slaDeadline(group: Group, severity: Severity): Date {
  const created = new Date(group.earliestCreatedAt).getTime();
  return new Date(created + SLA_HOURS[severity] * 60 * 60 * 1000);
}

function slaBadge(deadline: Date, now: number): { text: string; className: string } {
  const remainingMs = deadline.getTime() - now;
  const remainingHours = remainingMs / (1000 * 60 * 60);
  if (remainingMs <= 0) {
    const overdueHours = Math.abs(remainingMs) / (1000 * 60 * 60);
    return {
      text: overdueHours < 1 ? 'متأخر' : `متأخر ${Math.round(overdueHours)} س`,
      className: 'bg-destructive/10 text-destructive',
    };
  }
  if (remainingHours < 1) return { text: `متبقي ${Math.round(remainingMs / 60000)} د`, className: 'bg-destructive/10 text-destructive' };
  if (remainingHours < 3) return { text: `متبقي ${Math.round(remainingHours)} س`, className: 'bg-gold-soft text-gold-ink' };
  return { text: `متبقي ${Math.round(remainingHours)} س`, className: 'bg-success-soft text-success-ink' };
}

export default function CommunityReports() {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [reviewedRows, setReviewedRows] = useState<(ReportRow & { community_name?: string })[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { showToast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from('community_reports')
      .select('id,community_id,reporter_id,reported_message_id,reported_user_id,reason,status,created_at')
      .order('created_at', { ascending: true });
    const rowsData = data ?? [];
    setRows(rowsData);

    const profileIds = Array.from(
      new Set(rowsData.flatMap((r) => [r.reporter_id, r.reported_user_id].filter(Boolean) as string[]))
    );
    const communityIds = Array.from(new Set(rowsData.map((r) => r.community_id)));
    const messageIds = Array.from(new Set(rowsData.map((r) => r.reported_message_id).filter(Boolean) as string[]));

    const [{ data: profiles }, { data: communitiesData }, { data: messages }] = await Promise.all([
      profileIds.length ? supabase.from('profiles').select('id,name').in('id', profileIds) : Promise.resolve({ data: [] }),
      communityIds.length ? supabase.from('communities').select('id,name').in('id', communityIds) : Promise.resolve({ data: [] }),
      messageIds.length ? supabase.from('community_messages').select('id,text,from_id').in('id', messageIds) : Promise.resolve({ data: [] }),
    ]);

    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));
    const communityNames: Record<string, string> = {};
    (communitiesData ?? []).forEach((c: any) => (communityNames[c.id] = c.name));
    const messageById: Record<string, { text: string; from_id: string }> = {};
    (messages ?? []).forEach((m: any) => (messageById[m.id] = m));

    const open = rowsData.filter((r) => r.status === 'open');
    const byTarget = new Map<string, Group>();
    for (const r of open) {
      const key = r.reported_message_id ? `msg:${r.reported_message_id}` : r.reported_user_id ? `user:${r.reported_user_id}` : `report:${r.id}`;
      const existing = byTarget.get(key);
      const reason = { reporter_name: names[r.reporter_id] ?? r.reporter_id, reason: r.reason, created_at: r.created_at };
      if (existing) {
        existing.reportIds.push(r.id);
        existing.reasons.push(reason);
        if (r.created_at < existing.earliestCreatedAt) existing.earliestCreatedAt = r.created_at;
      } else {
        const msg = r.reported_message_id ? messageById[r.reported_message_id] : undefined;
        byTarget.set(key, {
          targetKey: key,
          community_id: r.community_id,
          community_name: communityNames[r.community_id] ?? r.community_id,
          reported_message_id: r.reported_message_id,
          reported_user_id: r.reported_user_id,
          reported_user_name: r.reported_user_id ? names[r.reported_user_id] : undefined,
          message_text: msg?.text,
          message_from_name: msg ? names[msg.from_id] ?? msg.from_id : undefined,
          reportIds: [r.id],
          reasons: [reason],
          earliestCreatedAt: r.created_at,
        });
      }
    }
    setGroups(Array.from(byTarget.values()).sort((a, b) => a.earliestCreatedAt.localeCompare(b.earliestCreatedAt)));
    setReviewedRows(
      rowsData
        .filter((r) => r.status === 'reviewed')
        .map((r) => ({ ...r, community_name: communityNames[r.community_id] ?? r.community_id }))
        .reverse()
    );
  };

  useEffect(() => {
    load();
  }, []);

  const markGroupReviewed = async (group: Group) => {
    setBusyKey(group.targetKey);
    await supabase.from('community_reports').update({ status: 'reviewed' }).in('id', group.reportIds);
    setBusyKey(null);
    showToast(`تمت مراجعة ${group.reportIds.length} بلاغ`, async () => {
      await supabase.from('community_reports').update({ status: 'open' }).in('id', group.reportIds);
      load();
    });
    logAction({
      type: 'mod',
      action: 'مراجعة بلاغات مجمّعة',
      target: `${group.community_name} — ${group.reportIds.length} بلاغ`,
      diff: { status: { before: 'open', after: 'reviewed' } },
    });
    load();
  };

  const deleteMessage = async (group: Group) => {
    if (!group.reported_message_id) return;
    if (!confirm('حذف هذي الرسالة نهائيًا وإغلاق البلاغات المرتبطة بها؟')) return;
    setBusyKey(group.targetKey);
    await supabase.from('community_messages').delete().eq('id', group.reported_message_id);
    await supabase.from('community_reports').update({ status: 'reviewed' }).in('id', group.reportIds);
    setBusyKey(null);
    logAction({
      type: 'mod',
      action: 'حذف رسالة مُبلَّغ عنها',
      target: `${group.community_name} — ${group.message_from_name ?? ''}`,
      note: group.message_text,
    });
    load();
  };

  const groupsWithMeta = useMemo(
    () =>
      groups.map((g) => {
        const severity = severityOf(g.reportIds.length);
        const deadline = slaDeadline(g, severity);
        return { group: g, severity, sla: slaBadge(deadline, now) };
      }),
    [groups, now]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">بلاغات المجتمعات</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          البلاغات على نفس الرسالة أو العضو تُجمَّع هنا ببطاقة واحدة. الشدة والموعد النهائي (SLA) محسوبة فعليًا: شدة عالية من 3
          بلاغات فأكثر على نفس الهدف (موعدها 24 ساعة من أول بلاغ)، غير ذلك 72 ساعة. لون الموعد: أحمر أقل من ساعة (أو متأخر)، ذهبي
          أقل من 3 ساعات.
        </p>
      </div>

      <div className="surface-card mb-6 divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : groupsWithMeta.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه بلاغات مفتوحة</div>
        ) : (
          groupsWithMeta.map(({ group: g, severity, sla }) => (
            <div key={g.targetKey} className="flex items-start gap-3 p-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {g.community_name} — {g.reported_message_id ? 'بلاغ عن رسالة' : 'بلاغ عن عضو'}
                    {g.reported_user_name ? `: ${g.reported_user_name}` : ''}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {g.reportIds.length} بلاغ
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_CLASS[severity]}`}>
                    شدة {SEVERITY_LABEL[severity]}
                  </span>
                  <span className={`num rounded-full px-2 py-0.5 text-[10px] font-bold ${sla.className}`}>{sla.text}</span>
                </div>
                {g.message_text ? (
                  <div className="mt-1.5 rounded-md bg-secondary p-2 text-xs text-foreground">
                    «{g.message_text}» — {g.message_from_name}
                  </div>
                ) : null}
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {g.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {r.reporter_name}: {r.reason} · {new Date(r.created_at).toLocaleDateString('ar')}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2">
                {g.reported_message_id ? (
                  <button
                    onClick={() => deleteMessage(g)}
                    disabled={busyKey === g.targetKey}
                    className="rounded-md border border-destructive px-4 py-1.5 text-xs font-bold text-destructive disabled:opacity-50"
                  >
                    حذف الرسالة
                  </button>
                ) : null}
                <button
                  onClick={() => markGroupReviewed(g)}
                  disabled={busyKey === g.targetKey}
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
                {r.community_name} — {r.reason}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
