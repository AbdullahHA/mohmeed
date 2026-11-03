import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Row = {
  id: string;
  community_id: string;
  reporter_id: string;
  reported_message_id: string | null;
  reported_user_id: string | null;
  reason: string;
  status: 'open' | 'reviewed';
  created_at: string;
  reporter_name?: string;
  reported_user_name?: string;
  community_name?: string;
};

export default function CommunityReports() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('community_reports')
      .select('id,community_id,reporter_id,reported_message_id,reported_user_id,reason,status,created_at')
      .order('created_at', { ascending: false });
    const rowsData = data ?? [];
    const profileIds = Array.from(
      new Set(rowsData.flatMap((r) => [r.reporter_id, r.reported_user_id].filter(Boolean) as string[]))
    );
    const communityIds = Array.from(new Set(rowsData.map((r) => r.community_id)));
    const [{ data: profiles }, { data: communitiesData }] = await Promise.all([
      profileIds.length ? supabase.from('profiles').select('id,name').in('id', profileIds) : Promise.resolve({ data: [] }),
      communityIds.length ? supabase.from('communities').select('id,name').in('id', communityIds) : Promise.resolve({ data: [] }),
    ]);
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));
    const communityNames: Record<string, string> = {};
    (communitiesData ?? []).forEach((c: any) => (communityNames[c.id] = c.name));
    setRows(
      rowsData.map((r) => ({
        ...r,
        reporter_name: names[r.reporter_id],
        reported_user_name: r.reported_user_id ? names[r.reported_user_id] : undefined,
        community_name: communityNames[r.community_id] ?? r.community_id,
      }))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const markReviewed = async (row: Row) => {
    setBusyId(row.id);
    await supabase.from('community_reports').update({ status: 'reviewed' }).eq('id', row.id);
    setBusyId(null);
    load();
  };

  const open = (rows ?? []).filter((r) => r.status === 'open');
  const reviewed = (rows ?? []).filter((r) => r.status === 'reviewed');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">بلاغات المجتمعات</h1>
        <p className="mt-1 text-xs text-muted-foreground">بلاغات عن رسائل أو أعضاء داخل مجتمعات التطبيق.</p>
      </div>

      <div className="surface-card mb-6 divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : open.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه بلاغات مفتوحة</div>
        ) : (
          open.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">
                  {r.community_name} — {r.reported_message_id ? 'بلاغ عن رسالة' : 'بلاغ عن عضو'}
                  {r.reported_user_name ? `: ${r.reported_user_name}` : ''}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">السبب: {r.reason}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  من: {r.reporter_name ?? r.reporter_id} · {new Date(r.created_at).toLocaleDateString('ar')}
                </div>
              </div>
              <button
                onClick={() => markReviewed(r)}
                disabled={busyId === r.id}
                className="shrink-0 rounded-md bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                تمت المراجعة
              </button>
            </div>
          ))
        )}
      </div>

      {reviewed.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-foreground">بلاغات مراجَعة</h2>
          <div className="surface-card divide-y divide-border">
            {reviewed.map((r) => (
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
