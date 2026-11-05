import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';

type Row = {
  id: string;
  requester_id: string;
  name: string;
  tagline: string;
  emoji: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  community_id: string | null;
  requester_name?: string;
};

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, '')
    .replace(/\s+/g, '-');
  return base || `community-${Date.now()}`;
}

export default function CommunityRequests() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('community_requests')
      .select('id,requester_id,name,tagline,emoji,reason,status,created_at,community_id')
      .order('created_at', { ascending: false });
    const requesterIds = Array.from(new Set((data ?? []).map((r) => r.requester_id)));
    const { data: profiles } = requesterIds.length
      ? await supabase.from('profiles').select('id,name').in('id', requesterIds)
      : { data: [] as { id: string; name: string }[] };
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p) => (names[p.id] = p.name));
    setRows((data ?? []).map((r) => ({ ...r, requester_name: names[r.requester_id] })));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (row: Row) => {
    setBusyId(row.id);
    setError(null);
    // Upsert both steps so a retry after a partial failure (e.g. the
    // community got created but the moderator insert was rejected) never
    // hits a duplicate-key error on the part that already succeeded.
    const communityId = row.community_id ?? slugify(row.name);
    const { error: communityError } = await supabase.from('communities').upsert(
      {
        id: communityId,
        name: row.name,
        tagline: row.tagline,
        emoji: row.emoji,
        color: '#1359D3',
        base_member_count: 0,
      },
      { onConflict: 'id' }
    );
    if (communityError) {
      setBusyId(null);
      setError(`تعذّر إنشاء المجتمع: ${communityError.message}`);
      return;
    }
    const { error: memberError } = await supabase
      .from('community_members')
      .upsert(
        { community_id: communityId, profile_id: row.requester_id, role: 'moderator' },
        { onConflict: 'community_id,profile_id' }
      );
    if (memberError) {
      setBusyId(null);
      setError(`تعذّر تعيين المشرف: ${memberError.message}`);
      return;
    }
    const { data: me } = await supabase.auth.getUser();
    await supabase
      .from('community_requests')
      .update({ status: 'approved', community_id: communityId, reviewed_by: me.user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    logAction({ type: 'mod', action: 'موافقة على طلب إنشاء مجتمع', target: row.name });
    load();
  };

  const reject = async (row: Row) => {
    setBusyId(row.id);
    const { data: me } = await supabase.auth.getUser();
    await supabase
      .from('community_requests')
      .update({ status: 'rejected', reviewed_by: me.user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    logAction({ type: 'mod', action: 'رفض طلب إنشاء مجتمع', target: row.name });
    load();
  };

  const pending = (rows ?? []).filter((r) => r.status === 'pending');
  const reviewed = (rows ?? []).filter((r) => r.status !== 'pending');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">طلبات إنشاء مجتمعات</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          كل طلب معتمد يُنشئ مجتمعًا حقيقيًا ويجعل صاحب الطلب مشرفًا عليه (community_members.role = moderator).
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="surface-card mb-6 divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : pending.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه طلبات قيد المراجعة</div>
        ) : (
          pending.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-lg">{r.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.tagline}</div>
                <div className="mt-1 text-xs text-muted-foreground">السبب: {r.reason}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  من: {r.requester_name ?? r.requester_id} · {new Date(r.created_at).toLocaleDateString('ar')}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  onClick={() => approve(r)}
                  disabled={busyId === r.id}
                  className="rounded-md bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  موافقة
                </button>
                <button
                  onClick={() => reject(r)}
                  disabled={busyId === r.id}
                  className="rounded-md border border-border px-4 py-1.5 text-xs font-bold text-destructive disabled:opacity-50"
                >
                  رفض
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {reviewed.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-foreground">طلبات سابقة</h2>
          <div className="surface-card divide-y divide-border">
            {reviewed.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <span className="text-lg">{r.emoji}</span>
                <div className="flex-1 text-sm text-foreground">{r.name}</div>
                <span className={`text-xs font-semibold ${r.status === 'approved' ? 'text-primary' : 'text-destructive'}`}>
                  {r.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
